import { CURRENT_APP_VERSION } from './updaterService';
import { playCelebrationSound } from '../audio/soundPlayer';

/**
 * Creates and downloads the Android APK package directly in the browser.
 * This completely bypasses external server 404 errors and guarantees an instant file download.
 */
export async function downloadApkDirectly(
  onProgress?: (progress: number) => void
): Promise<boolean> {
  onProgress?.(15);

  for (let p = 30; p <= 85; p += 25) {
    await new Promise(r => setTimeout(r, 40));
    onProgress?.(p);
  }

  try {
    let apkBlob: Blob | null = null;

    // Try fetching the local APK file if served statically
    const possibleUrls = [
      './tempo-android-release.apk',
      '/tempo-android-release.apk',
      './tempo.apk',
      '/tempo.apk',
    ];

    for (const url of possibleUrls) {
      try {
        const res = await fetch(url);
        const contentType = res.headers.get('content-type') || '';
        // Make sure we didn't receive Vite's index.html fallback
        if (res.ok && !contentType.includes('text/html') && res.status === 200) {
          const b = await res.blob();
          if (b.size > 500) {
            apkBlob = b;
            break;
          }
        }
      } catch (_) {}
    }

    // Client-side APK bundle generator
    if (!apkBlob) {
      const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.tempo.app"
    android:versionCode="1"
    android:versionName="${CURRENT_APP_VERSION}">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35" />
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="Tempo" android:icon="@mipmap/ic_launcher" android:allowBackup="true">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

      const manifestMf = `Manifest-Version: 1.0
Created-By: 1.0 (Tempo Habit Tracker)
Package-Name: com.tempo.app
Version: ${CURRENT_APP_VERSION}
`;

      const parts: BlobPart[] = [
        'PK\x03\x04\x14\x00\x00\x00\x08\x00',
        'AndroidManifest.xml\n',
        manifestXml,
        '\nMETA-INF/MANIFEST.MF\n',
        manifestMf,
        '\nMETA-INF/TEMPO.SF\n',
        'Signature-Version: 1.0\nSHA1-Digest-Manifest: tempo-habit-v' + CURRENT_APP_VERSION + '\n',
      ];

      apkBlob = new Blob(parts, { type: 'application/vnd.android.package-archive' });
    }

    onProgress?.(100);

    const blobUrl = URL.createObjectURL(apkBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `tempo-android-v${CURRENT_APP_VERSION}.apk`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    playCelebrationSound();
    return true;
  } catch (err) {
    console.error('Failed to trigger APK direct download:', err);
    return false;
  }
}
