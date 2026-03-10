import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  GoogleUser,
  signInWithGoogle,
  signOutGoogle,
  getStoredGoogleUser,
  loadGoogleIdentityServices,
  backgroundTokenRefresh,
  isSessionValid,
} from '@/utils/googleAuth';

interface GoogleAuthContextType {
  user: GoogleUser | null;
  isLoading: boolean;
  isSigningIn: boolean;
  signIn: () => Promise<GoogleUser>;
  signOut: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

const BG_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval>>();

  // Load stored user on mount — user stays logged in even if access token expired
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await getStoredGoogleUser();
        if (stored && isSessionValid(stored)) {
          setUser(stored);
        }
        // Pre-load GIS script (no-op on native)
        loadGoogleIdentityServices().catch(() => {});
      } catch (err) {
        console.error('Failed to load Google user:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Background token refresh — keeps access token fresh without user interaction
  useEffect(() => {
    if (!user) return;

    // Do an immediate refresh attempt if needed
    backgroundTokenRefresh().catch(() => {});

    // Then refresh every 45 minutes
    refreshTimerRef.current = setInterval(() => {
      backgroundTokenRefresh().then(async () => {
        // Update user state with refreshed token
        const refreshed = await getStoredGoogleUser();
        if (refreshed) setUser(refreshed);
      }).catch(() => {});
    }, BG_REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [user?.email]); // Only restart when user changes, not on every token update

  const signIn = useCallback(async (): Promise<GoogleUser> => {
    setIsSigningIn(true);
    try {
      const googleUser = await signInWithGoogle();
      setUser(googleUser);
      return googleUser;
    } catch (err) {
      console.error('Google sign-in failed:', err);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutGoogle();
    setUser(null);
  }, []);

  return (
    <GoogleAuthContext.Provider value={{ user, isLoading, isSigningIn, signIn, signOut }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}
