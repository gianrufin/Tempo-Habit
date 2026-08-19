package com.tempo.app.ui.screens.today

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.data.preferences.PreferencesRepository
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.data.repository.MoodRepository
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.HabitTemplate
import com.tempo.app.domain.model.HabitWithTodayStatus
import com.tempo.app.domain.model.Mood
import com.tempo.app.domain.model.MoodEntry
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.RoutineWithHabits
import com.tempo.app.widget.WidgetRefresher
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class DayStripEntry(
    val date: LocalDate,
    val completionFraction: Float,
    val isToday: Boolean,
)

data class TodayUiState(
    val greetingName: String = "",
    val selectedDate: LocalDate = LocalDate.now(),
    val dayStrip: List<DayStripEntry> = emptyList(),
    val routineGroups: List<RoutineWithHabits> = emptyList(),
    val standaloneHabits: List<HabitWithTodayStatus> = emptyList(),
    val moodForSelectedDate: MoodEntry? = null,
) {
    val isEmpty: Boolean get() = routineGroups.isEmpty() && standaloneHabits.isEmpty()
    val completionFraction: Float
        get() = dayStrip.firstOrNull { it.date == selectedDate }?.completionFraction ?: 0f
}

private const val DAYS_BEFORE_TODAY = 4
private const val DAYS_AFTER_TODAY = 10

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class TodayViewModel @Inject constructor(
    private val repository: HabitRepository,
    private val preferencesRepository: PreferencesRepository,
    private val moodRepository: MoodRepository,
    @ApplicationContext private val appContext: Context,
) : ViewModel() {

    private val today: LocalDate = LocalDate.now()
    private val stripDates: List<LocalDate> = (-DAYS_BEFORE_TODAY..DAYS_AFTER_TODAY).map { today.plusDays(it.toLong()) }

    private val _selectedDate = MutableStateFlow(today)

    private val habitsForSelectedDate = _selectedDate.flatMapLatest { date -> repository.observeHabitsForDate(date) }
    private val moodForSelectedDate = _selectedDate.flatMapLatest { date -> moodRepository.observeForDate(date) }

    private val baseState = combine(
        preferencesRepository.userPreferences,
        habitsForSelectedDate,
        repository.observeActiveRoutines(),
        repository.observeAggregatesForDates(stripDates),
        _selectedDate,
    ) { prefs, habits, routines, aggregates, selectedDate ->
        val aggregateByDate = aggregates.associateBy { it.date }
        val dayStrip = stripDates.map { date ->
            DayStripEntry(
                date = date,
                completionFraction = aggregateByDate[date]?.completionFraction ?: 0f,
                isToday = date == today,
            )
        }

        val routineGroups = routines.mapNotNull { routine ->
            val habitsInRoutine = habits.filter { it.habit.routineId == routine.id }
            if (habitsInRoutine.isEmpty()) null else RoutineWithHabits(routine, habitsInRoutine)
        }
        val standalone = habits.filter { it.habit.routineId == null }

        TodayUiState(
            greetingName = prefs.displayName,
            selectedDate = selectedDate,
            dayStrip = dayStrip,
            routineGroups = routineGroups,
            standaloneHabits = standalone,
        )
    }

    val uiState: StateFlow<TodayUiState> = combine(baseState, moodForSelectedDate) { state, mood ->
        state.copy(moodForSelectedDate = mood)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), TodayUiState(selectedDate = today))

    fun onSelectDate(date: LocalDate) {
        _selectedDate.value = date
    }

    fun onToggleHabit(habitId: Long) {
        viewModelScope.launch {
            repository.cycleCompletion(habitId, _selectedDate.value)
            WidgetRefresher.refresh(appContext)
        }
    }

    /** Swipe-to-skip: uses a streak freeze for the selected date instead of marking the habit done. */
    fun onSkipHabit(habitId: Long) {
        viewModelScope.launch {
            repository.markExcused(habitId, _selectedDate.value)
            WidgetRefresher.refresh(appContext)
        }
    }

    fun onSetMood(mood: Mood, note: String = "") {
        viewModelScope.launch { moodRepository.setMood(_selectedDate.value, mood, note) }
    }

    fun onQuickAddHabit(template: HabitTemplate) {
        viewModelScope.launch {
            repository.addHabit(
                Habit(
                    name = template.name,
                    icon = template.icon,
                    colorArgb = template.colorArgb,
                    recurrenceRule = RecurrenceRule.Daily,
                    createdAt = today,
                ),
            )
            WidgetRefresher.refresh(appContext)
        }
    }
}
