package com.tempo.app

import android.app.Application
import android.util.Log
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.tempo.app.alarm.RescheduleAlarmsWorker
import com.tempo.app.data.backup.BackupRestoreStaging
import com.tempo.app.data.backup.BackupScheduler
import com.tempo.app.reminder.ReminderScheduler
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class TempoApplication : Application(), Configuration.Provider {

    @Inject lateinit var workerFactory: HiltWorkerFactory
    @Inject lateinit var reminderScheduler: ReminderScheduler
    @Inject lateinit var backupScheduler: BackupScheduler

    override val workManagerConfiguration: Configuration
        get() = try {
            Configuration.Builder().setWorkerFactory(workerFactory).build()
        } catch (e: Throwable) {
            Log.e("TempoApp", "Error configuring WorkManager", e)
            Configuration.Builder().build()
        }

    override fun onCreate() {
        try {
            BackupRestoreStaging.applyIfNeeded(this)
        } catch (e: Throwable) {
            Log.e("TempoApp", "Backup restore staging failed gracefully", e)
        }

        super.onCreate()

        try {
            reminderScheduler.cancelLegacyPollingReminders()
            reminderScheduler.scheduleStreakRiskCheck()
            reminderScheduler.scheduleWeeklyRecap()
        } catch (e: Throwable) {
            Log.e("TempoApp", "ReminderScheduler startup failed gracefully", e)
        }

        try {
            backupScheduler.scheduleDaily(hour = DEFAULT_BACKUP_HOUR, minute = 0)
        } catch (e: Throwable) {
            Log.e("TempoApp", "BackupScheduler startup failed gracefully", e)
        }

        try {
            RescheduleAlarmsWorker.enqueue(this)
        } catch (e: Throwable) {
            Log.e("TempoApp", "RescheduleAlarmsWorker startup failed gracefully", e)
        }
    }

    private companion object {
        const val DEFAULT_BACKUP_HOUR = 21
    }
}
