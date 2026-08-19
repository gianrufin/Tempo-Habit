package com.tempo.app.reminder

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.util.concurrent.TimeUnit
import javax.inject.Inject

class ReminderScheduler @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    /** Cleans up the old imprecise 15-minute polling worker from earlier app versions — exact
     * per-habit/task alarms (see [com.tempo.app.alarm.AlarmRescheduler]) replaced it. */
    fun cancelLegacyPollingReminders() {
        WorkManager.getInstance(context).cancelUniqueWork(LEGACY_UNIQUE_WORK_NAME)
    }

    fun scheduleStreakRiskCheck() {
        val request = PeriodicWorkRequestBuilder<StreakRiskWorker>(1, TimeUnit.DAYS)
            .setInitialDelay(delayUntilNextDailyTime(STREAK_RISK_HOUR, 0), TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            STREAK_RISK_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            request,
        )
    }

    fun scheduleWeeklyRecap() {
        val request = PeriodicWorkRequestBuilder<WeeklyRecapWorker>(7, TimeUnit.DAYS)
            .setInitialDelay(delayUntilNextWeeklyTime(DayOfWeek.SUNDAY, WEEKLY_RECAP_HOUR, 0), TimeUnit.MILLISECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            WEEKLY_RECAP_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            request,
        )
    }

    private fun delayUntilNextDailyTime(hour: Int, minute: Int): Long {
        val now = LocalDateTime.now(ZoneId.systemDefault())
        var target = now.toLocalDate().atTime(LocalTime.of(hour, minute))
        if (!target.isAfter(now)) target = target.plusDays(1)
        return java.time.Duration.between(now, target).toMillis()
    }

    private fun delayUntilNextWeeklyTime(dayOfWeek: DayOfWeek, hour: Int, minute: Int): Long {
        val now = LocalDateTime.now(ZoneId.systemDefault())
        var target = now.toLocalDate().atTime(LocalTime.of(hour, minute))
        while (target.dayOfWeek != dayOfWeek || !target.isAfter(now)) {
            target = target.plusDays(1)
        }
        return java.time.Duration.between(now, target).toMillis()
    }

    companion object {
        private const val LEGACY_UNIQUE_WORK_NAME = "reminder_check"
        private const val STREAK_RISK_WORK_NAME = "streak_risk_check"
        private const val WEEKLY_RECAP_WORK_NAME = "weekly_recap"
        private const val STREAK_RISK_HOUR = 20
        private const val WEEKLY_RECAP_HOUR = 18
    }
}
