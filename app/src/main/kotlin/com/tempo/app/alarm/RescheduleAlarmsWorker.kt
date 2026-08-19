package com.tempo.app.alarm

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/** Recomputes and (re)schedules every active habit/task reminder alarm — run at app startup and
 * after boot, since [android.app.AlarmManager] alarms don't survive a reboot. */
@HiltWorker
class RescheduleAlarmsWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val alarmRescheduler: AlarmRescheduler,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        alarmRescheduler.rescheduleAll()
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "reschedule_alarms"

        fun enqueue(context: Context) {
            val request = OneTimeWorkRequestBuilder<RescheduleAlarmsWorker>().build()
            WorkManager.getInstance(context).enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request)
        }
    }
}
