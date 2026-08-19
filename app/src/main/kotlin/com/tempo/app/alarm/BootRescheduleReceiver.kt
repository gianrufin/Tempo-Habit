package com.tempo.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** AlarmManager alarms are wiped on reboot; re-derive and reschedule every one of them. */
class BootRescheduleReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return
        RescheduleAlarmsWorker.enqueue(context)
    }
}
