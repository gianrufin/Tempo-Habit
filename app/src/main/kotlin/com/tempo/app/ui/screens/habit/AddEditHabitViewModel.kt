package com.tempo.app.ui.screens.habit

import android.content.Context
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.alarm.AlarmRescheduler
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.TimeOfDay
import com.tempo.app.widget.WidgetRefresher
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import javax.inject.Inject

enum class RecurrenceType { DAILY, SPECIFIC_WEEKDAYS, EVERY_N_DAYS, TIMES_PER_WEEK, MONTHLY_BY_DATE }

data class AddEditHabitUiState(
    val habitId: Long? = null,
    val name: String = "",
    val icon: String = DEFAULT_ICONS.first(),
    val colorArgb: Long = DEFAULT_COLORS.first(),
    val recurrenceType: RecurrenceType = RecurrenceType.DAILY,
    val selectedWeekdays: Set<DayOfWeek> = setOf(DayOfWeek.MONDAY),
    val everyNDays: Int = 2,
    val timesPerWeek: Int = 3,
    val monthlyDayOfMonth: Int = 1,
    val streakFreezeAllowance: Int = 1,
    val graceDays: Int = 1,
    val timeOfDay: TimeOfDay = TimeOfDay.forCurrentTime(),
    val routineId: Long? = null,
    val reminderTimes: List<LocalTime> = emptyList(),
    val pausedUntil: LocalDate? = null,
    val isSaved: Boolean = false,
) {
    val isValid: Boolean get() = name.isNotBlank()

    companion object {
        val DEFAULT_ICONS = listOf("💧", "🏃", "📚", "🧘", "🛌", "✍️", "🥗", "💪", "🐕")
        val DEFAULT_COLORS = listOf(0xFF6750A4L, 0xFF386A20L, 0xFFB3261EL, 0xFF7D5260L, 0xFF4FC3F7L, 0xFFFF7A45L)
    }
}

@HiltViewModel
class AddEditHabitViewModel @Inject constructor(
    private val repository: HabitRepository,
    private val alarmRescheduler: AlarmRescheduler,
    @ApplicationContext private val appContext: Context,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val habitIdArg: Long? = savedStateHandle.get<Long>("habitId")?.takeIf { it != 0L }
    private val routineIdArg: Long? = savedStateHandle.get<Long>("routineId")?.takeIf { it != -1L }

    private val _uiState = MutableStateFlow(
        AddEditHabitUiState(habitId = habitIdArg, routineId = routineIdArg),
    )
    val uiState = _uiState.asStateFlow()

    init {
        habitIdArg?.let { id ->
            viewModelScope.launch {
                repository.getHabit(id)?.let { habit -> _uiState.value = habit.toUiState() }
            }
        }
    }

    fun onNameChange(value: String) = update { it.copy(name = value) }
    fun onIconChange(value: String) = update { it.copy(icon = value) }
    fun onColorChange(value: Long) = update { it.copy(colorArgb = value) }
    fun onRecurrenceTypeChange(value: RecurrenceType) = update { it.copy(recurrenceType = value) }
    fun onToggleWeekday(day: DayOfWeek) = update {
        val current = it.selectedWeekdays
        it.copy(selectedWeekdays = if (day in current) current - day else current + day)
    }
    fun onEveryNDaysChange(value: Int) = update { it.copy(everyNDays = value.coerceIn(1, 60)) }
    fun onTimesPerWeekChange(value: Int) = update { it.copy(timesPerWeek = value.coerceIn(1, 7)) }
    fun onMonthlyDayChange(value: Int) = update { it.copy(monthlyDayOfMonth = value.coerceIn(1, 31)) }
    fun onStreakFreezeAllowanceChange(value: Int) = update { it.copy(streakFreezeAllowance = value.coerceIn(0, 7)) }
    fun onGraceDaysChange(value: Int) = update { it.copy(graceDays = value.coerceIn(0, 7)) }
    fun onTimeOfDayChange(value: TimeOfDay) = update { it.copy(timeOfDay = value) }
    fun onAddReminderTime(time: LocalTime) = update {
        if (time in it.reminderTimes) it else it.copy(reminderTimes = (it.reminderTimes + time).sorted())
    }
    fun onRemoveReminderTime(time: LocalTime) = update { it.copy(reminderTimes = it.reminderTimes - time) }
    fun onPauseFor(days: Int) = update { it.copy(pausedUntil = LocalDate.now().plusDays(days.toLong())) }
    fun onResumeFromPause() = update { it.copy(pausedUntil = null) }

    fun save() {
        val state = _uiState.value
        if (!state.isValid) return
        viewModelScope.launch {
            val recurrenceRule = state.toRecurrenceRule()
            val savedId: Long
            if (state.habitId == null) {
                savedId = repository.addHabit(
                    Habit(
                        name = state.name.trim(),
                        icon = state.icon,
                        colorArgb = state.colorArgb,
                        recurrenceRule = recurrenceRule,
                        streakFreezeAllowance = state.streakFreezeAllowance,
                        graceDays = state.graceDays,
                        timeOfDay = state.timeOfDay,
                        routineId = state.routineId,
                        reminderTimes = state.reminderTimes,
                        createdAt = LocalDate.now(),
                        pausedUntil = state.pausedUntil,
                    ),
                )
            } else {
                val existing = repository.getHabit(state.habitId) ?: return@launch
                savedId = state.habitId
                repository.updateHabit(
                    existing.copy(
                        name = state.name.trim(),
                        icon = state.icon,
                        colorArgb = state.colorArgb,
                        recurrenceRule = recurrenceRule,
                        streakFreezeAllowance = state.streakFreezeAllowance,
                        graceDays = state.graceDays,
                        timeOfDay = state.timeOfDay,
                        reminderTimes = state.reminderTimes,
                        pausedUntil = state.pausedUntil,
                    ),
                )
            }
            WidgetRefresher.refresh(appContext)
            alarmRescheduler.rescheduleHabit(savedId)
            _uiState.value = _uiState.value.copy(isSaved = true)
        }
    }

    fun delete() {
        val id = _uiState.value.habitId ?: return
        viewModelScope.launch {
            repository.archiveHabit(id)
            WidgetRefresher.refresh(appContext)
            alarmRescheduler.rescheduleHabit(id)
            _uiState.value = _uiState.value.copy(isSaved = true)
        }
    }

    private fun update(transform: (AddEditHabitUiState) -> AddEditHabitUiState) {
        _uiState.value = transform(_uiState.value)
    }

    private fun Habit.toUiState(): AddEditHabitUiState {
        val base = AddEditHabitUiState(
            habitId = id,
            name = name,
            icon = icon,
            colorArgb = colorArgb,
            streakFreezeAllowance = streakFreezeAllowance,
            graceDays = graceDays,
            timeOfDay = timeOfDay,
            routineId = routineId,
            reminderTimes = reminderTimes,
            pausedUntil = pausedUntil,
        )
        return when (val rule = recurrenceRule) {
            is RecurrenceRule.Daily -> base.copy(recurrenceType = RecurrenceType.DAILY)
            is RecurrenceRule.SpecificWeekdays -> base.copy(
                recurrenceType = RecurrenceType.SPECIFIC_WEEKDAYS,
                selectedWeekdays = rule.weekdays,
            )
            is RecurrenceRule.EveryNDays -> base.copy(
                recurrenceType = RecurrenceType.EVERY_N_DAYS,
                everyNDays = rule.n,
            )
            is RecurrenceRule.TimesPerWeek -> base.copy(
                recurrenceType = RecurrenceType.TIMES_PER_WEEK,
                timesPerWeek = rule.times,
            )
            is RecurrenceRule.MonthlyByDate -> base.copy(
                recurrenceType = RecurrenceType.MONTHLY_BY_DATE,
                monthlyDayOfMonth = rule.dayOfMonth,
            )
        }
    }

    private fun AddEditHabitUiState.toRecurrenceRule(): RecurrenceRule = when (recurrenceType) {
        RecurrenceType.DAILY -> RecurrenceRule.Daily
        RecurrenceType.SPECIFIC_WEEKDAYS -> RecurrenceRule.SpecificWeekdays(
            selectedWeekdays.ifEmpty { setOf(LocalDate.now().dayOfWeek) },
        )
        RecurrenceType.EVERY_N_DAYS -> RecurrenceRule.EveryNDays(everyNDays, LocalDate.now().toEpochDay())
        RecurrenceType.TIMES_PER_WEEK -> RecurrenceRule.TimesPerWeek(timesPerWeek)
        RecurrenceType.MONTHLY_BY_DATE -> RecurrenceRule.MonthlyByDate(monthlyDayOfMonth)
    }
}
