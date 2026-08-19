package com.tempo.app.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator

/**
 * Plays the chosen (or default) alarm sound on loop plus a repeating vibration pattern, until
 * [stop] is called from Stop/Snooze — used by both [TimerAlarmReceiver] (heads-up/background) and
 * [com.tempo.app.ui.alarm.TimerAlarmActivity] (foreground splash), so a single source of truth
 * means tapping Stop from either always actually silences it.
 */
object AlarmSoundPlayer {
    private var ringtone: Ringtone? = null
    private var vibrator: Vibrator? = null

    @Synchronized
    fun start(context: Context, soundUriString: String?) {
        if (ringtone?.isPlaying == true) return

        val uri = soundUriString?.let { runCatching { Uri.parse(it) }.getOrNull() }
            ?: RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getValidRingtoneUri(context)

        ringtone = uri?.let { RingtoneManager.getRingtone(context, it) }?.apply {
            audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                isLooping = true
            }
            play()
        }

        vibrator = context.getSystemService(Vibrator::class.java)?.apply {
            vibrate(VibrationEffect.createWaveform(VIBRATION_PATTERN, 0))
        }
    }

    @Synchronized
    fun stop() {
        ringtone?.stop()
        ringtone = null
        vibrator?.cancel()
        vibrator = null
    }

    fun isPlaying(): Boolean = ringtone?.isPlaying == true

    private val VIBRATION_PATTERN = longArrayOf(0, 600, 400)
}
