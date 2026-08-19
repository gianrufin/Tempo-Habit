package com.tempo.app

import android.app.Application
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
        get() = Configuration.Builder().setWorkerFactory(workerFactory).build()

    override fun onCreate() {
        // Must run before anything (Hilt, WorkManager, Compose) ever asks for a Room connection.
        BackupRestoreStaging.applyIfNeeded(this)

        super.onCreate()
        reminderScheduler.cancelLegacyPollingReminders()
        reminderScheduler.scheduleStreakRiskCheck()
        reminderScheduler.scheduleWeeklyRecap()
        backupScheduler.scheduleDaily(hour = DEFAULT_BACKUP_HOUR, minute = 0)
        RescheduleAlarmsWorker.enqueue(this)
    }

    private companion object {
        const val DEFAULT_BACKUP_HOUR = 21
    }
}
