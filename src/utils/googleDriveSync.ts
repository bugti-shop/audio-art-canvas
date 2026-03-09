// Google Drive API utilities for app data folder sync
import { getValidAccessToken, refreshGoogleToken } from './googleAuth';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER_NAME = 'NPD_Sync_Data';

// Helper: fetch with automatic 401 retry (refresh token and retry once)
const driveApiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    // Token was rejected — try one silent refresh + single retry
    try {
      const refreshed = await refreshGoogleToken();
      const retryRes = await fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${refreshed.accessToken}` },
      });

      if (retryRes.status === 401) {
        throw new Error('Authentication expired. Please sign in again.');
      }

      return retryRes;
    } catch {
      throw new Error('Authentication expired. Please sign in again.');
    }
  }

  return res;
};

// Get or create the app data folder in Drive
export const getOrCreateAppFolder = async (): Promise<string> => {
  // Search for existing folder
  const searchRes = await driveApiFetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(
      `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}&spaces=drive&fields=files(id,name)`
  );

  if (!searchRes.ok) throw new Error(`Drive search failed: ${searchRes.status}`);
  const searchData = await searchRes.json();

  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await driveApiFetch(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) throw new Error(`Failed to create folder: ${createRes.status}`);
  const folder = await createRes.json();
  return folder.id;
};

// List files in the app folder
export const listDriveFiles = async (
  folderId: string,
  pageToken?: string
): Promise<{ files: DriveFile[]; nextPageToken?: string }> => {
  let url = `${DRIVE_API}/files?q=${encodeURIComponent(
    `'${folderId}' in parents and trashed=false`
  )}&fields=files(id,name,modifiedTime,size,appProperties)&pageSize=100`;

  if (pageToken) url += `&pageToken=${pageToken}`;

  const res = await driveApiFetch(url);
  if (!res.ok) throw new Error(`Failed to list files: ${res.status}`);
  return res.json();
};

// Upload/update a JSON file
export const uploadJsonFile = async (
  folderId: string,
  fileName: string,
  data: any,
  existingFileId?: string
): Promise<string> => {
  const metadata: any = {
    name: fileName,
    mimeType: 'application/json',
    appProperties: {
      lastModified: new Date().toISOString(),
      version: String(data._version || 1),
    },
  };

  if (!existingFileId) {
    metadata.parents = [folderId];
  }

  const jsonContent = JSON.stringify(data);
  const boundary = '-------npd_boundary';

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${jsonContent}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `${DRIVE_UPLOAD_API}/files/${existingFileId}?uploadType=multipart`
    : `${DRIVE_UPLOAD_API}/files?uploadType=multipart`;

  const res = await driveApiFetch(url, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed [${res.status}]: ${err}`);
  }

  const result = await res.json();
  return result.id;
};

// Download a file's content
export const downloadFileContent = async <T = any>(fileId: string): Promise<T> => {
  const res = await driveApiFetch(`${DRIVE_API}/files/${fileId}?alt=media`);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.json();
};

// Delete a file (move to trash)
export const deleteFile = async (fileId: string): Promise<void> => {
  const res = await driveApiFetch(`${DRIVE_API}/files/${fileId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
};

// Get Drive storage quota
export const getDriveStorageQuota = async (): Promise<{
  usage: number;
  limit: number;
}> => {
  const res = await driveApiFetch(`${DRIVE_API}/about?fields=storageQuota`);
  if (!res.ok) throw new Error(`Failed to get quota: ${res.status}`);
  const data = await res.json();

  return {
    usage: parseInt(data.storageQuota.usage || '0'),
    limit: parseInt(data.storageQuota.limit || '0'),
  };
};

// Get changes start token for incremental sync
export const getStartPageToken = async (): Promise<string> => {
  const res = await driveApiFetch(`${DRIVE_API}/changes/startPageToken`);
  if (!res.ok) throw new Error(`Failed to get start token: ${res.status}`);
  const data = await res.json();
  return data.startPageToken;
};

// Get changes since last sync
export const getChanges = async (
  pageToken: string
): Promise<{ changes: DriveChange[]; newStartPageToken?: string; nextPageToken?: string }> => {
  const res = await driveApiFetch(
    `${DRIVE_API}/changes?pageToken=${pageToken}&fields=changes(fileId,file(id,name,modifiedTime,trashed,appProperties),removed),newStartPageToken,nextPageToken`
  );
  if (!res.ok) throw new Error(`Failed to get changes: ${res.status}`);
  return res.json();
};

// Types
export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  appProperties?: Record<string, string>;
}

export interface DriveChange {
  fileId: string;
  removed?: boolean;
  file?: DriveFile & { trashed?: boolean };
}
