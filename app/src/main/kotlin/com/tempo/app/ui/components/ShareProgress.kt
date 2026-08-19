package com.tempo.app.ui.components

import android.content.Context
import android.content.Intent

/**
 * Shares a plain-text progress summary via the standard Android share sheet — the scaled-down,
 * no-backend replacement for a real-time social/accountability circle: no server, just a snapshot
 * the user can drop into any chat.
 */
fun shareProgressText(context: Context, text: String) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    }
    context.startActivity(Intent.createChooser(intent, "Share progress"))
}
