package com.tempo.app.ui.screens.timer

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.Habit
import com.tempo.app.ui.theme.TempoExtraShapes

@Composable
fun TimerScreen(modifier: Modifier = Modifier, viewModel: TimerViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Text(text = "Timer", style = MaterialTheme.typography.headlineSmall)

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TimerMode.entries.forEach { mode ->
                FilterChip(
                    selected = state.mode == mode,
                    onClick = { viewModel.onSelectMode(mode) },
                    label = { Text(mode.label) },
                    shape = TempoExtraShapes.pill,
                )
            }
        }

        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            when (state.mode) {
                TimerMode.POMODORO -> PomodoroContent(state, viewModel)
                TimerMode.STOPWATCH -> StopwatchContent(state, viewModel)
                TimerMode.COUNTDOWN -> CountdownContent(state, viewModel)
            }
        }
    }
}

@Composable
private fun PomodoroContent(state: TimerUiState, viewModel: TimerViewModel) {
    val habits by viewModel.activeHabits.collectAsState()

    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(24.dp)) {
        Text(
            text = if (state.pomodoroIsBreak) "Break" else "Focus",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary,
        )
        RingTimeDisplay(
            timeText = formatMinSec(state.pomodoroRemainingSeconds),
            progress = state.progressFraction,
            isRunning = state.isRunning,
            ringColor = if (state.pomodoroIsBreak) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary,
        )
        TimerControls(isRunning = state.isRunning, onStart = viewModel::start, onPause = viewModel::pause, onReset = viewModel::reset)
        if (habits.isNotEmpty()) {
            LinkedHabitPicker(
                habits = habits,
                linkedHabitId = state.linkedHabitId,
                onSelect = viewModel::onSelectLinkedHabit,
            )
        }
    }
}

@Composable
private fun LinkedHabitPicker(habits: List<Habit>, linkedHabitId: Long?, onSelect: (Long?) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val linkedHabit = habits.firstOrNull { it.id == linkedHabitId }

    OutlinedButton(onClick = { expanded = true }, shape = TempoExtraShapes.pill) {
        Text(
            if (linkedHabit != null) "Completes: ${linkedHabit.icon} ${linkedHabit.name}" else "Link a habit to this focus session",
        )
    }
    DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
        DropdownMenuItem(text = { Text("None") }, onClick = { onSelect(null); expanded = false })
        habits.forEach { habit ->
            DropdownMenuItem(
                text = { Text("${habit.icon} ${habit.name}") },
                onClick = { onSelect(habit.id); expanded = false },
            )
        }
    }
}

@Composable
private fun StopwatchContent(state: TimerUiState, viewModel: TimerViewModel) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(24.dp)) {
        val totalSeconds = state.stopwatchElapsedMillis / 1000
        val lapFraction = (state.stopwatchElapsedMillis % 60_000) / 60_000f
        RingTimeDisplay(
            timeText = formatStopwatch(state.stopwatchElapsedMillis),
            progress = lapFraction,
            isRunning = state.isRunning,
            ringColor = MaterialTheme.colorScheme.primary,
        )
        TimerControls(isRunning = state.isRunning, onStart = viewModel::start, onPause = viewModel::pause, onReset = viewModel::reset)
        Text(
            "${totalSeconds / 60} min elapsed",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun CountdownContent(state: TimerUiState, viewModel: TimerViewModel) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(24.dp)) {
        if (!state.isRunning) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedButton(onClick = { viewModel.onAdjustCountdownMinutes(-1) }, shape = TempoExtraShapes.pill) {
                    Icon(Icons.Filled.Remove, contentDescription = "Fewer minutes")
                }
                Text("${state.countdownSetMinutes} min", style = MaterialTheme.typography.titleMedium)
                OutlinedButton(onClick = { viewModel.onAdjustCountdownMinutes(1) }, shape = TempoExtraShapes.pill) {
                    Icon(Icons.Filled.Add, contentDescription = "More minutes")
                }
            }
        }
        RingTimeDisplay(
            timeText = formatMinSec(state.countdownRemainingSeconds),
            progress = state.progressFraction,
            isRunning = state.isRunning,
            ringColor = MaterialTheme.colorScheme.primary,
        )
        TimerControls(isRunning = state.isRunning, onStart = viewModel::start, onPause = viewModel::pause, onReset = viewModel::reset)
    }
}

private fun formatMinSec(seconds: Int): String = "%02d:%02d".format(seconds / 60, seconds % 60)

private fun formatStopwatch(elapsedMillis: Long): String {
    val minutes = elapsedMillis / 60_000
    val seconds = (elapsedMillis / 1000) % 60
    val tenths = (elapsedMillis % 1000) / 100
    return "%02d:%02d.%d".format(minutes, seconds, tenths)
}

/**
 * A circular progress ring — animates smoothly toward [progress] each tick and gently pulses
 * while [isRunning], so the timer visibly breathes instead of just swapping digits.
 */
@Composable
private fun RingTimeDisplay(
    timeText: String,
    progress: Float,
    isRunning: Boolean,
    ringColor: Color,
) {
    val animatedProgress by animateFloatAsState(targetValue = progress, label = "ring-progress")

    val infiniteTransition = rememberInfiniteTransition(label = "ring-pulse")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isRunning) 1.03f else 1f,
        animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing), RepeatMode.Reverse),
        label = "pulse",
    )

    Box(modifier = Modifier.size(220.dp).scale(pulse), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val strokeWidth = 14.dp.toPx()
            val ringRadius = (minOf(size.width, size.height) - strokeWidth) / 2f

            // A full 360° drawArc leaves a visible seam where the stroke starts/ends instead of
            // closing cleanly — drawCircle doesn't have that problem, so it's used for the track
            // and for the progress arc itself whenever it's (at least visually) a complete loop.
            drawCircle(
                color = ringColor.copy(alpha = 0.15f),
                radius = ringRadius,
                style = Stroke(width = strokeWidth),
            )

            val sweep = animatedProgress.coerceIn(0f, 1f) * 360f
            if (sweep >= 359.9f) {
                drawCircle(
                    color = ringColor,
                    radius = ringRadius,
                    style = Stroke(width = strokeWidth),
                )
            } else if (sweep > 0f) {
                drawArc(
                    color = ringColor,
                    startAngle = -90f,
                    sweepAngle = sweep,
                    useCenter = false,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                    size = Size(ringRadius * 2, ringRadius * 2),
                    topLeft = Offset((size.width - ringRadius * 2) / 2f, (size.height - ringRadius * 2) / 2f),
                )
            }
        }
        Text(text = timeText, style = MaterialTheme.typography.displayMedium)
    }
}

@Composable
private fun TimerControls(isRunning: Boolean, onStart: () -> Unit, onPause: () -> Unit, onReset: () -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        OutlinedButton(onClick = onReset, shape = TempoExtraShapes.pill) {
            Icon(Icons.Filled.Replay, contentDescription = "Reset")
        }
        Button(
            onClick = if (isRunning) onPause else onStart,
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(0.5f),
        ) {
            Icon(if (isRunning) Icons.Filled.Pause else Icons.Filled.PlayArrow, contentDescription = if (isRunning) "Pause" else "Start")
            Text(if (isRunning) "  Pause" else "  Start")
        }
    }
}
