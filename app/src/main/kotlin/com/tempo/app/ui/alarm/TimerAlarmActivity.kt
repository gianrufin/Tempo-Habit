package com.tempo.app.ui.alarm

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.addCallback
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tempo.app.alarm.AlarmSoundPlayer
import com.tempo.app.alarm.TimerAlarmActions
import com.tempo.app.alarm.TimerAlarmReceiver
import com.tempo.app.data.preferences.PreferencesRepository
import com.tempo.app.ui.theme.TempoTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * The branded, lock-screen-capable "alarm went off" splash for the Pomodoro/countdown timer —
 * launched via the timer alarm notification's full-screen intent, exactly like a system alarm
 * clock app, with Stop and Snooze as the only way out.
 */
@AndroidEntryPoint
class TimerAlarmActivity : ComponentActivity() {

    @Inject lateinit var actions: TimerAlarmActions
    @Inject lateinit var preferencesRepository: PreferencesRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                    android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            )
        }

        // Same as a real alarm clock: back doesn't dismiss it, only Stop/Snooze do.
        onBackPressedDispatcher.addCallback(this) { /* no-op */ }

        val mode = intent.getStringExtra(TimerAlarmReceiver.EXTRA_MODE) ?: ""
        val label = intent.getStringExtra(TimerAlarmReceiver.EXTRA_LABEL) ?: "Time's up!"
        val linkedHabitId = intent.getLongExtra(TimerAlarmReceiver.EXTRA_LINKED_HABIT_ID, -1L).takeIf { it != -1L }

        // Idempotent: the receiver that launched us already started it in the common case; this
        // only actually kicks off playback if we somehow got here first.
        lifecycleScope.launch {
            val prefs = preferencesRepository.userPreferences.first()
            AlarmSoundPlayer.start(this@TimerAlarmActivity, prefs.alarmSoundUri)
        }

        setContent {
            TempoTheme {
                TimerAlarmScreen(
                    label = label,
                    onStop = {
                        actions.stop()
                        finish()
                    },
                    onSnooze = {
                        actions.snooze(mode, label, linkedHabitId)
                        finish()
                    },
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Only stop the loop if the user didn't already do so via Stop/Snooze (both call finish()
        // right after silencing it, so this is a no-op then) — covers back-button/task-kill too.
        AlarmSoundPlayer.stop()
    }
}

@Composable
private fun TimerAlarmScreen(label: String, onStop: () -> Unit, onSnooze: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "alarm-pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "scale",
    )

    Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFF0B0B0F)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceEvenly,
        ) {
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text(
                    text = "Tempo",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White.copy(alpha = 0.6f),
                )
            }

            Box(contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(180.dp)
                        .graphicsLayer { scaleX = pulseScale; scaleY = pulseScale }
                        .background(Color.White.copy(alpha = 0.08f), CircleShape),
                )
                Text(text = "⏰", fontSize = 72.sp)
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Text(
                    text = "Your Tempo timer has finished",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White.copy(alpha = 0.7f),
                )
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Button(
                    onClick = onStop,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                    contentPadding = PaddingValues(vertical = 18.dp),
                ) {
                    Text("Stop", style = MaterialTheme.typography.titleMedium)
                }
                OutlinedButton(
                    onClick = onSnooze,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                    contentPadding = PaddingValues(vertical = 18.dp),
                ) {
                    Text("Snooze 5 min", style = MaterialTheme.typography.titleMedium)
                }
            }
        }
    }
}
