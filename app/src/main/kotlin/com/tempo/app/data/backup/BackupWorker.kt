package com.tempo.app.data.backup

import android.content.Context
import android.net.Uri
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.tempo.app.data.preferences.PreferencesRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first

@HiltWorker
class BackupWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val backupManager: BackupManager,
    private val preferencesRepository: PreferencesRepository,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val prefs = preferencesRepository.userPreferences.first()
        if (!prefs.backupDailyEnabled) return Result.success()
        val uriString = prefs.backupFolderUri ?: return Result.success()

        val outcome = backupManager.backupTo(Uri.parse(uriString))
        return if (outcome.isSuccess) {
            preferencesRepository.setLastBackupAtMillis(System.currentTimeMillis())
            Result.success()
        } else {
            Result.retry()
        }
    }
}
