package com.tempo.app.alarm

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.tempo.app.data.preferences.PreferencesRepository
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.reminder.NotificationHelper
import com.tempo.app.ui.alarm.TimerAlarmActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

/** Fired by the exact alarm scheduled when a Pomodoro segment or countdown timer starts —
 * this is what actually "goes off," independent of whether the app process is even alive. */
@AndroidEntryPoint
class TimerAlarmReceiver : BroadcastReceiver() {

    @Inject lateinit var habitRepository: HabitRepository
    @Inject lateinit var notificationHelper: NotificationHelper
    @Inject lateinit var preferencesRepository: PreferencesRepository

    override fun onReceive(context: Context, intent: Intent) {
        AlarmDiagnostics.recordReceiverFired(context, intent.action)
        val mode = intent.getStringExtra(EXTRA_MODE) ?: return
        val label = intent.getStringExtra(EXTRA_LABEL) ?: "Time's up!"
        val linkedHabitId = intent.getLongExtra(EXTRA_LINKED_HABIT_ID, -1L).takeIf { it != -1L }

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (linkedHabitId != null) {
                    habitRepository.markDone(linkedHabitId, LocalDate.now())
                }

                val prefs = preferencesRepository.userPreferences.first()
                AlarmSoundPlayer.start(context, prefs.alarmSoundUri)

                val fullScreenIntent = PendingIntent.getActivity(
                    context,
                    AlarmRequestCodes.TIMER,
                    Intent(context, TimerAlarmActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        putExtra(EXTRA_MODE, mode)
                        putExtra(EXTRA_LABEL, label)
                        linkedHabitId?.let { putExtra(EXTRA_LINKED_HABIT_ID, it) }
                    },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )
                val stopIntent = actionPendingIntent(context, ACTION_STOP, mode, label, linkedHabitId)
                val snoozeIntent = actionPendingIntent(context, ACTION_SNOOZE, mode, label, linkedHabitId)

                notificationHelper.showTimerAlarm(
                    notificationId = TIMER_NOTIFICATION_ID,
                    title = label,
                    text = "Tap to open Tempo",
                    fullScreenIntent = fullScreenIntent,
                    stopIntent = stopIntent,
                    snoozeIntent = snoozeIntent,
                )
            } finally {
                pendingResult.finish()
            }
        }
    }

    private fun actionPendingIntent(
        context: Context,
        action: String,
        mode: String,
        label: String,
        linkedHabitId: Long?,
    ): PendingIntent {
        val intent = Intent(context, TimerAlarmActionReceiver::class.java).apply {
            this.action = action
            putExtra(EXTRA_MODE, mode)
            putExtra(EXTRA_LABEL, label)
            linkedHabitId?.let { putExtra(EXTRA_LINKED_HABIT_ID, it) }
        }
        return PendingIntent.getBroadcast(
            context,
            action.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    companion object {
        const val ACTION_TIMER_ALARM = "com.tempo.app.action.TIMER_ALARM"
        const val ACTION_STOP = "com.tempo.app.action.STOP_TIMER_ALARM"
        const val ACTION_SNOOZE = "com.tempo.app.action.SNOOZE_TIMER_ALARM"
        const val EXTRA_MODE = "extra_mode"
        const val EXTRA_LABEL = "extra_label"
        const val EXTRA_LINKED_HABIT_ID = "extra_linked_habit_id"
        const val TIMER_NOTIFICATION_ID = 4_000_000
    }
}
