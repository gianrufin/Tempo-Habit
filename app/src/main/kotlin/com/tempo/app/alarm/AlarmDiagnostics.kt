package com.tempo.app.alarm

import android.content.Context

/**
 * A plain SharedPreferences write (no Hilt, no coroutines) that the alarm receivers hit as the
 * very first thing they do — independent of whether notification posting later succeeds. This is
 * the only way to tell apart "the scheduled alarm never reached the app at all" (an OEM/AlarmManager
 * problem) from "it reached the app but showing the notification failed" (an app-side bug), since
 * from the user's side both look identical: no notification, no crash, no visible signal either way.
 */
object AlarmDiagnostics {
    private const val PREFS_NAME = "tempo_alarm_diagnostics"
    private const val KEY_LAST_FIRED_AT = "last_fired_at_millis"
    private const val KEY_LAST_ACTION = "last_action"

    fun recordReceiverFired(context: Context, action: String?) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong(KEY_LAST_FIRED_AT, System.currentTimeMillis())
            .putString(KEY_LAST_ACTION, action)
            .apply()
    }

    /** Returns (action, firedAtMillis) for the most recent alarm the app's process actually received, if any. */
    fun lastFired(context: Context): Pair<String?, Long>? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (!prefs.contains(KEY_LAST_FIRED_AT)) return null
        return prefs.getString(KEY_LAST_ACTION, null) to prefs.getLong(KEY_LAST_FIRED_AT, 0L)
    }
}
