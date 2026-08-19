package com.tempo.app.timer

import android.app.NotificationManager
import android.content.Context
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject

/**
 * Toggles system-wide Do Not Disturb for the duration of a Pomodoro focus segment. Requires the
 * user to have granted the special "Notification policy access" permission (there's no manifest
 * permission for it) — silently does nothing if it hasn't been granted, since forcing that grant
 * isn't worth interrupting a timer start over.
 */
class FocusDndController @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val notificationManager: NotificationManager
        get() = context.getSystemService(NotificationManager::class.java)

    fun hasAccess(): Boolean = notificationManager.isNotificationPolicyAccessGranted

    fun enable() {
        if (!hasAccess()) return
        runCatching {
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
        }.onFailure { Log.w(TAG, "Failed to enable focus DND", it) }
    }

    fun disable() {
        if (!hasAccess()) return
        runCatching {
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
        }.onFailure { Log.w(TAG, "Failed to disable focus DND", it) }
    }

    private companion object {
        const val TAG = "FocusDndController"
    }
}
