package com.tempo.app.alarm

import android.content.Context
import android.content.Intent
import com.tempo.app.reminder.NotificationHelper
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject

/** Shared Stop/Snooze logic used by both the notification's action buttons
 * ([TimerAlarmActionReceiver]) and the full-screen splash ([com.tempo.app.ui.alarm.TimerAlarmActivity]). */
class TimerAlarmActions @Inject constructor(
    @ApplicationContext private val context: Context,
    private val scheduler: ExactAlarmScheduler,
    private val notificationHelper: NotificationHelper,
) {
    fun stop() {
        AlarmSoundPlayer.stop()
        notificationHelper.cancelTimerAlarm(TimerAlarmReceiver.TIMER_NOTIFICATION_ID)
    }

    fun snooze(mode: String, label: String, linkedHabitId: Long?) {
        stop()
        val triggerAtMillis = System.currentTimeMillis() + SNOOZE_DURATION_MILLIS
        val intent = Intent(context, TimerAlarmReceiver::class.java).apply {
            action = TimerAlarmReceiver.ACTION_TIMER_ALARM
            putExtra(TimerAlarmReceiver.EXTRA_MODE, mode)
            putExtra(TimerAlarmReceiver.EXTRA_LABEL, label)
            linkedHabitId?.let { putExtra(TimerAlarmReceiver.EXTRA_LINKED_HABIT_ID, it) }
        }
        scheduler.scheduleAlarmClock(AlarmRequestCodes.TIMER, triggerAtMillis, intent)
    }

    companion object {
        private const val SNOOZE_DURATION_MILLIS = 5 * 60 * 1000L
    }
}
