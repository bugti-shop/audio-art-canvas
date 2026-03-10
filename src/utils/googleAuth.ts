// Google Sign-In — native (Capgo Social Login) on Android/iOS, GIS on web
import { Capacitor } from '@capacitor/core';
import { getSetting, setSetting, removeSetting } from './settingsStorage';

const CLIENT_ID = '52777395492-vnlk2hkr3pv15dtpgp2m51p7418vll90.apps.googleusercontent.com';
const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
const NATIVE_SCOPES = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
];
const SESSION_TTL = 365 * 24 * 3600 * 1000; // 1 year session
const ACCESS_TOKEN_TTL = 3500 * 1000; // ~58 min (Google tokens last 1hr)
const NATIVE_LOGIN_OPTIONS = {
  scopes: NATIVE_SCOPES,
  forceRefreshToken: true,
  style: 'bottom' as const,
  filterByAuthorizedAccounts: true,
  autoSelectEnabled: true,
};

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  /** Real access token expiry (~1hr from issue) */
  accessTokenExpiresAt: number;
  /** Session expiry — user stays "logged in" until this (1 year) */
  expiresAt: number;
}

const isNative = () => Capacitor.isNativePlatform();

const makeUser = (
  profile: { email: string; name: string; picture: string },
  accessToken: string,
): GoogleUser => ({
  ...profile,
  accessToken,
  accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL,
  expiresAt: Date.now() + SESSION_TTL,
});

// ── Native (Capgo Social Login) ───────────────────────────────────────────

let nativeInitialized = false;

const ensureNativeInit = async () => {
  if (nativeInitialized) return;
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  await SocialLogin.initialize({
    google: { webClientId: CLIENT_ID },
  });
  nativeInitialized = true;
};

const getNativeAccessToken = (result: any): string => {
  const r = result?.result;
  return r?.accessToken?.token || r?.accessToken || '';
};

const extractNativeProfile = async (r: any, accessToken: string) => {
  let email = r.profile?.email || r.email || '';
  let name = r.profile?.name || r.name || '';
  let picture = r.profile?.imageUrl || r.profile?.picture || '';

  if (!email && accessToken) {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const info = await res.json();
        email = info.email || email;
        name = info.name || name;
        picture = info.picture || picture;
      }
    } catch {}
  }
  return { email, name: name || email, picture };
};

const nativeSignIn = async (): Promise<GoogleUser> => {
  await ensureNativeInit();
  const { SocialLogin } = await import('@capgo/capacitor-social-login');

  const result = await SocialLogin.login({
    provider: 'google',
    options: NATIVE_LOGIN_OPTIONS,
  });

  const r = result.result as any;
  const accessToken = getNativeAccessToken(result);
  if (!accessToken) throw new Error('No access token received from Google Sign-In');

  const profile = await extractNativeProfile(r, accessToken);
  const user = makeUser(profile, accessToken);
  await setSetting('googleUser', user);
  return user;
};

const nativeSignOut = async () => {
  try {
    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    await SocialLogin.logout({ provider: 'google' });
  } catch {}
};

const nativeRefresh = async (): Promise<GoogleUser> => {
  const stored = await getStoredGoogleUser();
  if (!stored) throw new Error('No stored Google user');

  await ensureNativeInit();
  const { SocialLogin } = await import('@capgo/capacitor-social-login');

  // 1) Try native refresh API (non-interactive)
  try {
    await SocialLogin.refresh({
      provider: 'google',
      options: NATIVE_LOGIN_OPTIONS,
    });
  } catch (err) {
    console.warn('Native refresh API failed, trying auto-select reauth:', err);
  }

  // 2) Re-auth with auto-select (usually no visible prompt)
  try {
    const result = await SocialLogin.login({
      provider: 'google',
      options: NATIVE_LOGIN_OPTIONS,
    });

    const r = result.result as any;
    const accessToken = getNativeAccessToken(result);
    if (!accessToken) return stored;

    const refreshedUser: GoogleUser = {
      email: r.profile?.email || r.email || stored.email,
      name: r.profile?.name || r.name || stored.name,
      picture: r.profile?.imageUrl || r.profile?.picture || stored.picture,
      accessToken,
      accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL,
      expiresAt: Date.now() + SESSION_TTL,
    };

    await setSetting('googleUser', refreshedUser);
    return refreshedUser;
  } catch (err) {
    console.warn('Native reauth failed, keeping stored token:', err);
    return stored;
  }
};

// ── Web (Google Identity Services) ────────────────────────────────────────

let tokenClient: any = null;
let gisLoaded = false;
let refreshInProgress: Promise<GoogleUser | null> | null = null;

export const loadGoogleIdentityServices = (): Promise<void> => {
  if (isNative()) return Promise.resolve();
  if (gisLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      gisLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => { gisLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

const initTokenClient = (onSuccess: (token: string) => void, onError: (err: any) => void) => {
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) { onError(new Error('GIS not loaded')); return; }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.error) { onError(response); return; }
      onSuccess(response.access_token);
    },
    error_callback: (error: any) => onError(error),
  });
};

const fetchUserInfo = async (accessToken: string): Promise<{ email: string; name: string; picture: string }> => {
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
      res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) break;
    } catch (err) {
      if (attempt === 2) throw new Error('Network error fetching user info');
    }
  }
  if (!res || !res.ok) throw new Error('Failed to fetch user info');
  const info = await res.json();
  return { email: info.email, name: info.name || info.email, picture: info.picture || '' };
};

const webSignIn = (): Promise<GoogleUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleIdentityServices();
      initTokenClient(
        async (accessToken) => {
          try {
            const info = await fetchUserInfo(accessToken);
            const user = makeUser(info, accessToken);
            await setSetting('googleUser', user);
            resolve(user);
          } catch (err) { reject(err); }
        },
        (err) => reject(err)
      );
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) { reject(err); }
  });
};

const webSignOut = async (user: GoogleUser | null) => {
  if (user?.accessToken) {
    try { (window as any).google?.accounts?.oauth2?.revoke?.(user.accessToken); } catch {}
  }
};

const webRefresh = (): Promise<GoogleUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleIdentityServices();
      initTokenClient(
        async (accessToken) => {
          try {
            const info = await fetchUserInfo(accessToken);
            const user = makeUser(info, accessToken);
            await setSetting('googleUser', user);
            resolve(user);
          } catch (err) { reject(err); }
        },
        (err) => reject(err)
      );
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) { reject(err); }
  });
};

// Silent web refresh — tries prompt:'' with timeout, never shows UI
const silentWebRefresh = (): Promise<GoogleUser | null> => {
  // Deduplicate concurrent refresh calls
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = new Promise<GoogleUser | null>(async (resolve) => {
    const timeout = setTimeout(() => resolve(null), 4000);
    try {
      await loadGoogleIdentityServices();
      initTokenClient(
        async (accessToken) => {
          clearTimeout(timeout);
          try {
            const stored = await getStoredGoogleUser();
            // Reuse stored profile to avoid extra API call
            const user: GoogleUser = {
              email: stored?.email || '',
              name: stored?.name || '',
              picture: stored?.picture || '',
              accessToken,
              accessTokenExpiresAt: Date.now() + ACCESS_TOKEN_TTL,
              expiresAt: Date.now() + SESSION_TTL,
            };
            await setSetting('googleUser', user);
            resolve(user);
          } catch { resolve(null); }
        },
        () => { clearTimeout(timeout); resolve(null); }
      );
      tokenClient.requestAccessToken({ prompt: '' });
    } catch { clearTimeout(timeout); resolve(null); }
  }).finally(() => { refreshInProgress = null; });

  return refreshInProgress;
};

// ── Unified API ───────────────────────────────────────────────────────────

export const signInWithGoogle = (): Promise<GoogleUser> =>
  isNative() ? nativeSignIn() : webSignIn();

export const signOutGoogle = async (): Promise<void> => {
  const user = await getStoredGoogleUser();
  if (isNative()) {
    await nativeSignOut();
  } else {
    await webSignOut(user);
  }
  await removeSetting('googleUser');
};

export const getStoredGoogleUser = async (): Promise<GoogleUser | null> => {
  const user = await getSetting<GoogleUser | null>('googleUser', null);
  if (!user) return null;
  // Migrate old users missing accessTokenExpiresAt
  if (!user.accessTokenExpiresAt) {
    user.accessTokenExpiresAt = 0; // treat as expired, will refresh
  }
  return user;
};

/** Check if the session is still valid (1 year) — user stays "logged in" */
export const isSessionValid = (user: GoogleUser): boolean =>
  user.expiresAt > Date.now();

/** Check if the access token is still fresh (< 1hr) */
export const isAccessTokenFresh = (user: GoogleUser): boolean =>
  user.accessTokenExpiresAt > Date.now() + 60000;

/** @deprecated Use isAccessTokenFresh instead */
export const isTokenValid = (user: GoogleUser): boolean =>
  isAccessTokenFresh(user);

export const refreshGoogleToken = (): Promise<GoogleUser> =>
  isNative() ? nativeRefresh() : webRefresh();

/**
 * Get a valid access token for API calls.
 * - User stays logged in even if token refresh fails
 * - On native: returns stored token (401 retry handles refresh)
 * - On web: proactively refreshes if expired, falls back to stored token
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const user = await getStoredGoogleUser();
  if (!user) return null;

  // Session expired (1 year) — user needs to re-login
  if (!isSessionValid(user)) {
    return null;
  }

  // Native: return stored token; 401 retry in driveApiFetch handles refresh
  if (isNative()) return user.accessToken;

  // Web: if token is still fresh, use it
  if (isAccessTokenFresh(user)) return user.accessToken;

  // Try silent refresh (no UI prompt)
  try {
    const refreshed = await silentWebRefresh();
    if (refreshed) return refreshed.accessToken;
  } catch {
    // Silent refresh failed — return stale token, API 401 handler will retry
  }

  // Return stale token — better than null; driveApiFetch 401 handler will refresh
  return user.accessToken;
};

/**
 * Background token keep-alive for web.
 * Call periodically (e.g., every 45 min) to keep the session fresh
 * without user interaction.
 */
export const backgroundTokenRefresh = async (): Promise<void> => {
  if (isNative()) return; // Native handles refresh natively
  const user = await getStoredGoogleUser();
  if (!user || !isSessionValid(user)) return;
  if (isAccessTokenFresh(user)) return; // Still fresh, skip

  try {
    await silentWebRefresh();
  } catch {
    console.warn('Background token refresh failed — will retry later');
  }
};
