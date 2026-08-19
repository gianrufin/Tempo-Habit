package com.tempo.app.data.backup

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.Duration
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.util.concurrent.TimeUnit
import javax.inject.Inject

/**
 * The daily backup check always runs (harmless no-op if the user hasn't turned backup on or
 * chosen a folder yet — see [BackupWorker]); this just controls what time of day it fires.
 */
class BackupScheduler @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    fun scheduleDaily(hour: Int, minute: Int) {
        val request = PeriodicWorkRequestBuilder<BackupWorker>(1, TimeUnit.DAYS)
            .setInitialDelay(delayUntilNextDailyTime(hour, minute), TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
    }

    private fun delayUntilNextDailyTime(hour: Int, minute: Int): Long {
        val now = LocalDateTime.now(ZoneId.systemDefault())
        var target = now.toLocalDate().atTime(LocalTime.of(hour, minute))
        if (!target.isAfter(now)) target = target.plusDays(1)
        return Duration.between(now, target).toMillis()
    }

    companion object {
        private const val WORK_NAME = "daily_backup"
    }
}
