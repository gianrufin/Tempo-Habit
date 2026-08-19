package com.tempo.app.ui.screens.routine

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.Routine
import com.tempo.app.domain.model.TimeOfDay
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AddEditRoutineUiState(
    val routineId: Long? = null,
    val name: String = "",
    val icon: String = DEFAULT_ICONS.first(),
    val timeOfDay: TimeOfDay = TimeOfDay.forCurrentTime(),
    val isSaved: Boolean = false,
    val isDeleted: Boolean = false,
) {
    val isValid: Boolean get() = name.isNotBlank()

    companion object {
        val DEFAULT_ICONS = listOf("☀️", "🌤️", "🌙", "✨", "🏃", "🧘", "📚", "💧")
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class AddEditRoutineViewModel @Inject constructor(
    private val repository: HabitRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val routineIdArg: Long? = savedStateHandle.get<Long>("routineId")?.takeIf { it != 0L }

    private val _uiState = MutableStateFlow(AddEditRoutineUiState(routineId = routineIdArg))
    val uiState: StateFlow<AddEditRoutineUiState> = _uiState

    val habitsInRoutine: StateFlow<List<Habit>> = _uiState
        .map { it.routineId }
        .distinctUntilChanged()
        .flatMapLatest { routineId ->
            if (routineId == null) {
                flowOf(emptyList())
            } else {
                repository.observeActiveHabits().map { habits -> habits.filter { it.routineId == routineId } }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        routineIdArg?.let { id ->
            viewModelScope.launch {
                repository.getRoutine(id)?.let { routine ->
                    _uiState.value = _uiState.value.copy(
                        name = routine.name,
                        icon = routine.icon,
                        timeOfDay = routine.timeOfDay,
                    )
                }
            }
        }
    }

    fun onNameChange(value: String) = update { it.copy(name = value) }
    fun onIconChange(value: String) = update { it.copy(icon = value) }
    fun onTimeOfDayChange(value: TimeOfDay) = update { it.copy(timeOfDay = value) }

    fun save() {
        val state = _uiState.value
        if (!state.isValid) return
        viewModelScope.launch {
            if (state.routineId == null) {
                val newId = repository.addRoutine(
                    Routine(name = state.name.trim(), icon = state.icon, timeOfDay = state.timeOfDay),
                )
                _uiState.value = _uiState.value.copy(routineId = newId, isSaved = true)
            } else {
                val existing = repository.getRoutine(state.routineId) ?: return@launch
                repository.updateRoutine(
                    existing.copy(name = state.name.trim(), icon = state.icon, timeOfDay = state.timeOfDay),
                )
                _uiState.value = _uiState.value.copy(isSaved = true)
            }
        }
    }

    fun removeHabitFromRoutine(habitId: Long) {
        viewModelScope.launch {
            val habit = repository.getHabit(habitId) ?: return@launch
            repository.updateHabit(habit.copy(routineId = null))
        }
    }

    fun deleteRoutine() {
        val id = _uiState.value.routineId ?: return
        viewModelScope.launch {
            repository.archiveRoutine(id)
            _uiState.value = _uiState.value.copy(isDeleted = true)
        }
    }

    private fun update(transform: (AddEditRoutineUiState) -> AddEditRoutineUiState) {
        _uiState.value = transform(_uiState.value)
    }
}
