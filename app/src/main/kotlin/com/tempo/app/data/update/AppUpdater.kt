package com.tempo.app.data.update

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject

sealed class UpdateDownloadState {
    data object Idle : UpdateDownloadState()
    data class Downloading(val progressPercent: Int) : UpdateDownloadState()
    data object ReadyToInstall : UpdateDownloadState()
    data class Failed(val message: String) : UpdateDownloadState()
}

/**
 * Tempo isn't on the Play Store, so "updating" means downloading the latest release APK straight
 * from GitHub and handing it to the system package installer — the closest thing to a one-tap
 * in-app update a sideloaded app can offer. Android always shows its own install-confirmation
 * dialog for this (Play Protect scan + an explicit "Install" tap); no app, including this one, can
 * skip that without being a privileged system installer, so this saves the "open browser, find the
 * release, download the file, open it from notifications" dance down to one button plus that one
 * unavoidable system prompt.
 */
class AppUpdater @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val _downloadState = MutableStateFlow<UpdateDownloadState>(UpdateDownloadState.Idle)
    val downloadState: StateFlow<UpdateDownloadState> = _downloadState.asStateFlow()

    private var downloadedApkFile: File? = null

    /** Whether this app is allowed to prompt the system installer directly (vs. only via a browser). */
    fun canInstallPackages(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()

    fun requestInstallPackagesPermission() {
        runCatching {
            context.startActivity(
                Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                },
            )
        }
    }

    suspend fun downloadUpdate(): Unit = withContext(Dispatchers.IO) {
        _downloadState.value = UpdateDownloadState.Downloading(0)
        var connection: HttpURLConnection? = null
        try {
            connection = (URL(APK_DOWNLOAD_URL).openConnection() as HttpURLConnection).apply {
                instanceFollowRedirects = true
                connectTimeout = 15_000
                readTimeout = 15_000
            }
            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                _downloadState.value = UpdateDownloadState.Failed("Download failed: HTTP ${connection.responseCode}")
                return@withContext
            }

            val totalBytes = connection.contentLength
            val updatesDir = File(context.cacheDir, "updates").apply { mkdirs() }
            val file = File(updatesDir, "tempo-update.apk")

            connection.inputStream.use { input ->
                file.outputStream().use { output ->
                    val buffer = ByteArray(64 * 1024)
                    var totalRead = 0L
                    while (true) {
                        val read = input.read(buffer)
                        if (read == -1) break
                        output.write(buffer, 0, read)
                        totalRead += read
                        if (totalBytes > 0) {
                            _downloadState.value = UpdateDownloadState.Downloading(((totalRead * 100) / totalBytes).toInt())
                        }
                    }
                }
            }

            downloadedApkFile = file
            _downloadState.value = UpdateDownloadState.ReadyToInstall
        } catch (e: Exception) {
            _downloadState.value = UpdateDownloadState.Failed(e.message ?: "Download failed")
        } finally {
            connection?.disconnect()
        }
    }

    /** Hands the downloaded APK to the system installer — this always shows Android's own
     * install-confirmation UI; there is no way for a non-system app to skip it. */
    fun promptInstall() {
        val file = downloadedApkFile ?: return
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        runCatching { context.startActivity(intent) }
    }

    fun reset() {
        _downloadState.value = UpdateDownloadState.Idle
    }

    private companion object {
        const val APK_DOWNLOAD_URL =
            "https://github.com/gianrufin/Tempo/releases/download/debug-latest/tempo.apk"
    }
}
