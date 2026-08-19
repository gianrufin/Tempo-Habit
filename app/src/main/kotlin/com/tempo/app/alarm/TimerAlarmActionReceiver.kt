package com.tempo.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/** Handles the timer alarm notification's Stop/Snooze action buttons. */
@AndroidEntryPoint
class TimerAlarmActionReceiver : BroadcastReceiver() {

    @Inject lateinit var actions: TimerAlarmActions

    override fun onReceive(context: Context, intent: Intent) {
        val mode = intent.getStringExtra(TimerAlarmReceiver.EXTRA_MODE) ?: ""
        val label = intent.getStringExtra(TimerAlarmReceiver.EXTRA_LABEL) ?: ""
        val linkedHabitId = intent.getLongExtra(TimerAlarmReceiver.EXTRA_LINKED_HABIT_ID, -1L).takeIf { it != -1L }

        when (intent.action) {
            TimerAlarmReceiver.ACTION_STOP -> actions.stop()
            TimerAlarmReceiver.ACTION_SNOOZE -> actions.snooze(mode, label, linkedHabitId)
        }
    }
}
