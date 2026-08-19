package com.tempo.app.ui.components

import android.content.Context
import android.content.Intent

/** Relaunches the app's launcher activity in a fresh task and kills this process, so every
 * already-open Room/DAO reference gets replaced by ones pointing at a just-restored database. */
fun restartApp(context: Context) {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    intent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
    context.startActivity(intent)
    Runtime.getRuntime().exit(0)
}
