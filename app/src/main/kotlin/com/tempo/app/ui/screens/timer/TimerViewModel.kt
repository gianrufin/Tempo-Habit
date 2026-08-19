package com.tempo.app.ui.screens.timer

import android.content.Context
import android.content.Intent
import android.os.SystemClock
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.alarm.AlarmRequestCodes
import com.tempo.app.alarm.ExactAlarmScheduler
import com.tempo.app.alarm.TimerAlarmReceiver
import com.tempo.app.data.preferences.PreferencesRepository
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.domain.model.Habit
import com.tempo.app.timer.FocusDndController
import com.tempo.app.widget.WidgetRefresher
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

enum class TimerMode(val label: String) {
    POMODORO("Pomodoro"),
    STOPWATCH("Stopwatch"),
    COUNTDOWN("Timer"),
}

data class TimerUiState(
    val mode: TimerMode = TimerMode.POMODORO,
    val isRunning: Boolean = false,
    val pomodoroWorkMinutes: Int = 25,
    val pomodoroBreakMinutes: Int = 5,
    val pomodoroRemainingSeconds: Int = 25 * 60,
    val pomodoroIsBreak: Boolean = false,
    val stopwatchElapsedMillis: Long = 0L,
    val countdownSetMinutes: Int = 10,
    val countdownRemainingSeconds: Int = 10 * 60,
    val linkedHabitId: Long? = null,
) {
    /** Fraction of the current segment already elapsed, for the ring animation — 0f at the start, 1f when it ends. */
    val progressFraction: Float
        get() = when (mode) {
            TimerMode.POMODORO -> {
                val total = (if (pomodoroIsBreak) pomodoroBreakMinutes else pomodoroWorkMinutes) * 60
                if (total == 0) 0f else 1f - (pomodoroRemainingSeconds / total.toFloat())
            }
            TimerMode.COUNTDOWN -> {
                val total = countdownSetMinutes * 60
                if (total == 0) 0f else 1f - (countdownRemainingSeconds / total.toFloat())
            }
            TimerMode.STOPWATCH -> 0f
        }
}

@HiltViewModel
class TimerViewModel @Inject constructor(
    private val repository: HabitRepository,
    private val alarmScheduler: ExactAlarmScheduler,
    private val preferencesRepository: PreferencesRepository,
    private val focusDndController: FocusDndController,
    @ApplicationContext private val appContext: Context,
) : ViewModel() {

    private val _uiState = MutableStateFlow(TimerUiState())
    val uiState: StateFlow<TimerUiState> = _uiState.asStateFlow()

    val activeHabits: StateFlow<List<Habit>> = repository.observeActiveHabits()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private var tickerJob: Job? = null
    private var stopwatchStartUptimeMillis: Long = 0L
    private var stopwatchBaseElapsedMillis: Long = 0L

    fun onSelectMode(mode: TimerMode) {
        pause()
        _uiState.value = _uiState.value.copy(mode = mode)
    }

    fun onSelectLinkedHabit(habitId: Long?) {
        _uiState.value = _uiState.value.copy(linkedHabitId = habitId)
    }

    fun start() {
        if (_uiState.value.isRunning) return
        val state = _uiState.value
        _uiState.value = state.copy(isRunning = true)

        if (state.mode == TimerMode.STOPWATCH) {
            stopwatchBaseElapsedMillis = state.stopwatchElapsedMillis
            stopwatchStartUptimeMillis = SystemClock.uptimeMillis()
        } else {
            scheduleCurrentSegmentAlarm()
        }

        tickerJob = viewModelScope.launch {
            val tickMillis = if (_uiState.value.mode == TimerMode.STOPWATCH) 100L else 1000L
            while (true) {
                delay(tickMillis)
                tick()
            }
        }
        syncFocusDnd()
    }

    fun pause() {
        tickerJob?.cancel()
        tickerJob = null
        if (_uiState.value.isRunning) {
            _uiState.value = _uiState.value.copy(isRunning = false)
        }
        cancelTimerAlarm()
        syncFocusDnd()
    }

    fun reset() {
        pause()
        val state = _uiState.value
        _uiState.value = when (state.mode) {
            TimerMode.POMODORO -> state.copy(
                pomodoroRemainingSeconds = state.pomodoroWorkMinutes * 60,
                pomodoroIsBreak = false,
            )
            TimerMode.STOPWATCH -> state.copy(stopwatchElapsedMillis = 0L)
            TimerMode.COUNTDOWN -> state.copy(countdownRemainingSeconds = state.countdownSetMinutes * 60)
        }
    }

    /** Turns focus DND on only while a Pomodoro work segment (not its break) is actively running. */
    private fun syncFocusDnd() {
        viewModelScope.launch {
            val autoDndEnabled = preferencesRepository.userPreferences.first().autoDndDuringFocus
            val state = _uiState.value
            val shouldEnable = autoDndEnabled && state.isRunning && state.mode == TimerMode.POMODORO && !state.pomodoroIsBreak
            if (shouldEnable) focusDndController.enable() else focusDndController.disable()
        }
    }

    fun onAdjustCountdownMinutes(deltaMinutes: Int) {
        val state = _uiState.value
        if (state.isRunning) return
        val newMinutes = (state.countdownSetMinutes + deltaMinutes).coerceIn(1, 180)
        _uiState.value = state.copy(countdownSetMinutes = newMinutes, countdownRemainingSeconds = newMinutes * 60)
    }

    private fun tick() {
        val state = _uiState.value
        _uiState.value = when (state.mode) {
            TimerMode.POMODORO -> {
                if (state.pomodoroRemainingSeconds <= 1) {
                    val nowBreak = !state.pomodoroIsBreak
                    if (nowBreak) onPomodoroWorkSessionCompleted(state.linkedHabitId)
                    val next = state.copy(
                        pomodoroIsBreak = nowBreak,
                        pomodoroRemainingSeconds = if (nowBreak) state.pomodoroBreakMinutes * 60 else state.pomodoroWorkMinutes * 60,
                    )
                    scheduleCurrentSegmentAlarm(next)
                    _uiState.value = next
                    syncFocusDnd()
                    next
                } else {
                    state.copy(pomodoroRemainingSeconds = state.pomodoroRemainingSeconds - 1)
                }
            }
            TimerMode.STOPWATCH -> {
                val elapsed = stopwatchBaseElapsedMillis + (SystemClock.uptimeMillis() - stopwatchStartUptimeMillis)
                state.copy(stopwatchElapsedMillis = elapsed)
            }
            TimerMode.COUNTDOWN -> {
                if (state.countdownRemainingSeconds <= 1) {
                    tickerJob?.cancel()
                    tickerJob = null
                    state.copy(countdownRemainingSeconds = 0, isRunning = false)
                } else {
                    state.copy(countdownRemainingSeconds = state.countdownRemainingSeconds - 1)
                }
            }
        }
    }

    /** A finished Pomodoro focus block (transitioning into its break) marks the linked habit done for today. */
    private fun onPomodoroWorkSessionCompleted(linkedHabitId: Long?) {
        if (linkedHabitId == null) return
        viewModelScope.launch {
            repository.markDone(linkedHabitId, LocalDate.now())
            WidgetRefresher.refresh(appContext)
        }
    }

    /**
     * Schedules an exact alarm for exactly when the current segment ends, so the alarm still
     * fires — full-screen splash, sound, the works — even if the app gets backgrounded or killed.
     */
    private fun scheduleCurrentSegmentAlarm(state: TimerUiState = _uiState.value) {
        val (remainingSeconds, label) = when (state.mode) {
            TimerMode.POMODORO -> state.pomodoroRemainingSeconds to
                (if (state.pomodoroIsBreak) "Break's over!" else "Focus session done!")
            TimerMode.COUNTDOWN -> state.countdownRemainingSeconds to "Time's up!"
            TimerMode.STOPWATCH -> return
        }
        val triggerAtMillis = System.currentTimeMillis() + remainingSeconds * 1000L
        val intent = Intent(appContext, TimerAlarmReceiver::class.java).apply {
            action = TimerAlarmReceiver.ACTION_TIMER_ALARM
            putExtra(TimerAlarmReceiver.EXTRA_MODE, state.mode.name)
            putExtra(TimerAlarmReceiver.EXTRA_LABEL, label)
            if (state.mode == TimerMode.POMODORO && !state.pomodoroIsBreak) {
                state.linkedHabitId?.let { putExtra(TimerAlarmReceiver.EXTRA_LINKED_HABIT_ID, it) }
            }
        }
        alarmScheduler.scheduleAlarmClock(AlarmRequestCodes.TIMER, triggerAtMillis, intent)
    }

    private fun cancelTimerAlarm() {
        val intent = Intent(appContext, TimerAlarmReceiver::class.java).apply {
            action = TimerAlarmReceiver.ACTION_TIMER_ALARM
        }
        alarmScheduler.cancel(AlarmRequestCodes.TIMER, intent)
    }

    override fun onCleared() {
        super.onCleared()
        tickerJob?.cancel()
    }
}
