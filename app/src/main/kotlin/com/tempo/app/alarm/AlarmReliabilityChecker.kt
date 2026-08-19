package com.tempo.app.alarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject

/**
 * [ExactAlarmScheduler] uses [AlarmManager.setAlarmClock], which is documented as exempt from both
 * the Android 12+ "Alarms & reminders" special permission and Doze deferral on stock Android — but
 * many OEM skins (MIUI, ColorOS, FuntouchOS, some Samsung builds) run their own background-process
 * killer that silently drops alarm broadcasts anyway, regardless of what stock Android permits.
 * There's no documented API for those OEM-specific killers, but requesting the standard battery-
 * optimization exemption is the one lever that's known to help across most of them in practice.
 */
class AlarmReliabilityChecker @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val alarmManager: AlarmManager
        get() = context.getSystemService(AlarmManager::class.java)

    private val powerManager: PowerManager
        get() = context.getSystemService(PowerManager::class.java)

    /** [AlarmManager.setAlarmClock] doesn't need this, but some OEM firmware checks it anyway. */
    fun canScheduleExactAlarms(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

    fun isIgnoringBatteryOptimizations(): Boolean =
        powerManager.isIgnoringBatteryOptimizations(context.packageName)

    fun openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return
        runCatching {
            context.startActivity(
                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                },
            )
        }
    }

    fun requestIgnoreBatteryOptimizations() {
        runCatching {
            context.startActivity(
                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:${context.packageName}")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                },
            )
        }
    }
}
