// Google Drive API helpers - Picker + OAuth via Google Identity Services

export interface DriveFile {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  iconUrl?: string;
}

let gapiLoaded = false;
let gisLoaded = false;
let cachedAccessToken: string | null = null;

// Load the Google API (gapi) script
export function loadGapiScript(): Promise<void> {
  if (gapiLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.getElementById('gapi-script')) {
      gapiLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'gapi-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapiLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.head.appendChild(script);
  });
}

// Load Google Identity Services (GIS) script
export function loadGisScript(): Promise<void> {
  if (gisLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.getElementById('gis-script')) {
      gisLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

// Load both scripts in parallel
export async function loadGoogleScripts(): Promise<void> {
  await Promise.all([loadGapiScript(), loadGisScript()]);
  // Load the Picker API via gapi
  await new Promise<void>((resolve, reject) => {
    (window as any).gapi.load('picker', { callback: resolve, onerror: reject });
  });
}

// Request OAuth2 access token with drive.file scope
export function requestAccessToken(clientId: string): Promise<string> {
  if (cachedAccessToken) return Promise.resolve(cachedAccessToken);

  return new Promise((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        cachedAccessToken = response.access_token;
        // Auto-clear token before expiry
        setTimeout(() => { cachedAccessToken = null; }, (response.expires_in - 60) * 1000);
        resolve(response.access_token);
      },
    });
    tokenClient.requestAccessToken({ prompt: cachedAccessToken ? '' : 'consent' });
  });
}

// Clear cached token (for sign-out)
export function clearDriveToken() {
  cachedAccessToken = null;
}

// Open Google Picker for file selection/upload
export function openPicker(apiKey: string, accessToken: string): Promise<DriveFile[]> {
  return new Promise((resolve, reject) => {
    try {
      const google = (window as any).google;
      const docsView = new google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const uploadView = new google.picker.DocsUploadView();

      const picker = new google.picker.PickerBuilder()
        .addView(docsView)
        .addView(uploadView)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setTitle('Chọn hoặc tải file lên Google Drive')
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const files: DriveFile[] = data.docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              url: doc.url,
              size: doc.sizeBytes || 0,
              mimeType: doc.mimeType || '',
              iconUrl: doc.iconUrl || '',
            }));
            resolve(files);
          } else if (data.action === google.picker.Action.CANCEL) {
            resolve([]);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      reject(err);
    }
  });
}

function buildDriveFallbackUrl(fileId: string, mimeType?: string, pickerUrl?: string): string {
  if (pickerUrl && pickerUrl.startsWith('http')) return pickerUrl;

  switch (mimeType) {
    case 'application/vnd.google-apps.document':
      return `https://docs.google.com/document/d/${fileId}/edit`;
    case 'application/vnd.google-apps.spreadsheet':
      return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
    case 'application/vnd.google-apps.presentation':
      return `https://docs.google.com/presentation/d/${fileId}/edit`;
    case 'application/vnd.google-apps.form':
      return `https://docs.google.com/forms/d/${fileId}/edit`;
    default:
      return `https://drive.google.com/open?id=${fileId}`;
  }
}

interface SetFilePublicAccessParams {
  accessToken: string;
  fileId: string;
  mimeType?: string;
  pickerUrl?: string;
}

// Set file sharing to "anyone with link can view"
export async function setFilePublicAccess({
  accessToken,
  fileId,
  mimeType,
  pickerUrl,
}: SetFilePublicAccessParams): Promise<string> {
  const fallbackUrl = buildDriveFallbackUrl(fileId, mimeType, pickerUrl);

  // Try to create "anyone" permission. If API refuses (403/404), keep fallback link.
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  }).catch(() => null);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink,webContentLink&supportsAllDrives=true`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  ).catch(() => null as Response | null);

  if (res?.ok) {
    const data = await res.json();
    return data.webViewLink || data.webContentLink || fallbackUrl;
  }

  return fallbackUrl;
}
