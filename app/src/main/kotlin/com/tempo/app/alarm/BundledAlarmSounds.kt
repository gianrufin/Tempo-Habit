package com.tempo.app.alarm

data class BundledAlarmSound(val label: String, val rawResourceName: String)

/**
 * Notification/alarm sounds bundled directly in the app (res/raw) as an alternative to picking
 * from the device's system ringtone list — named for how each one actually sounds (measured by
 * pitch/brightness/length) rather than their source library filenames.
 */
object BundledAlarmSounds {
    val ALL = listOf(
        // Longest and lowest-pitched of the set — a mellow, multi-note chime.
        BundledAlarmSound("Golden Hour", "notif_golden_hour"),
        // Short, mid-high pitched blip with a touch of shimmer.
        BundledAlarmSound("Aura Ping", "notif_aura_ping"),
        // Brightest/crispest of the set — lots of high-frequency sparkle.
        BundledAlarmSound("Crystal Fizz", "notif_crystal_fizz"),
        // Shortest and deepest — a quick, soft, low thud.
        BundledAlarmSound("Velvet Pop", "notif_velvet_pop"),
        // Warm, soft, and slightly longer — a mellow low tone.
        BundledAlarmSound("Cloud Drift", "notif_cloud_drift"),
    )

    fun uriStringFor(packageName: String, rawResourceName: String): String =
        "android.resource://$packageName/raw/$rawResourceName"
}
