package com.tempo.app.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import com.tempo.app.MainActivity
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject

/**
 * Wraps [AlarmManager.setAlarmClock] — unlike [AlarmManager.setExactAndAllowWhileIdle], it's exempt
 * from the Android 12+ "Alarms & reminders" special permission on every API level, and the OS never
 * defers or batches it for Doze/battery optimization, since it's explicitly meant for user-visible
 * alarms. That's the guarantee this app's reminders and timers need: a reminder set for 12:00 AM
 * fires at 12:00 AM, not "sometime in the next 15 minutes" the way a periodic WorkManager check would.
 */
class ExactAlarmScheduler @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val alarmManager: AlarmManager
        get() = context.getSystemService(AlarmManager::class.java)

    /**
     * Never lets a scheduling failure (a stricter OEM battery/alarm policy, a revoked "Alarms &
     * reminders" toggle, anything else the OS decides to throw here) crash whatever user action
     * triggered it — starting a timer or saving a habit/task should never fail because a
     * best-effort background alarm couldn't be set.
     */
    /** Returns whether the alarm was actually accepted by [AlarmManager], so callers that need to
     * know (e.g. a "test alarm" button) can surface a real failure instead of it looking identical
     * to a silently-dropped background alarm. */
    fun scheduleAlarmClock(requestCode: Int, triggerAtMillis: Long, operationIntent: Intent): Result<Unit> {
        return runCatching {
            val operation = PendingIntent.getBroadcast(
                context,
                requestCode,
                operationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            val showIntent = PendingIntent.getActivity(
                context,
                requestCode,
                Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAtMillis, showIntent), operation)
        }.onFailure { Log.w(TAG, "Failed to schedule alarm (requestCode=$requestCode)", it) }
    }

    fun cancel(requestCode: Int, operationIntent: Intent) {
        runCatching {
            val operation = PendingIntent.getBroadcast(
                context,
                requestCode,
                operationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            alarmManager.cancel(operation)
        }.onFailure { Log.w(TAG, "Failed to cancel alarm (requestCode=$requestCode)", it) }
    }

    private companion object {
        const val TAG = "ExactAlarmScheduler"
    }
}
