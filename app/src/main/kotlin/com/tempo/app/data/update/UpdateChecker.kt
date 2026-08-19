package com.tempo.app.data.update

import com.tempo.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject

data class UpdateCheckResult(
    val upToDate: Boolean,
    val currentSha: String,
    val latestSha: String?,
    val error: String? = null,
)

/**
 * Tempo has no Play Store distribution — builds are published as GitHub Releases and sideloaded.
 * "Checking for updates" means comparing the commit this build was compiled from
 * ([BuildConfig.GIT_SHA], embedded at build time) against the latest commit on the tracked
 * branch, so the user knows whether a newer build has been published.
 */
class UpdateChecker @Inject constructor() {

    suspend fun checkForUpdate(): UpdateCheckResult = withContext(Dispatchers.IO) {
        val currentSha = BuildConfig.GIT_SHA
        var connection: HttpURLConnection? = null
        try {
            connection = (URL(COMMIT_API_URL).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                setRequestProperty("Accept", "application/vnd.github+json")
                connectTimeout = 10_000
                readTimeout = 10_000
            }
            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                return@withContext UpdateCheckResult(
                    upToDate = true,
                    currentSha = currentSha,
                    latestSha = null,
                    error = "GitHub returned HTTP ${connection.responseCode}",
                )
            }
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            val latestSha = Json.parseToJsonElement(body).jsonObject["sha"]?.jsonPrimitive?.content
            val upToDate = latestSha == null || latestSha.startsWith(currentSha)
            UpdateCheckResult(upToDate = upToDate, currentSha = currentSha, latestSha = latestSha)
        } catch (e: Exception) {
            UpdateCheckResult(upToDate = true, currentSha = currentSha, latestSha = null, error = e.message ?: "Network error")
        } finally {
            connection?.disconnect()
        }
    }

    companion object {
        private const val OWNER = "gianrufin"
        private const val REPO = "Tempo"
        private const val BRANCH = "claude/android-habit-planner-design-ril8qt"
        private const val COMMIT_API_URL = "https://api.github.com/repos/$OWNER/$REPO/commits/$BRANCH"
        const val RELEASES_URL = "https://github.com/$OWNER/$REPO/releases/tag/debug-latest"
    }
}
