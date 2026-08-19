package com.tempo.app.ui.screens.goals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.data.repository.GoalRepository
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.domain.model.Goal
import com.tempo.app.domain.model.Habit
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class AddEditGoalUiState(
    val title: String = "",
    val linkedHabitId: Long? = null,
    val targetCompletions: Int = 20,
    val isSaved: Boolean = false,
) {
    val isValid: Boolean get() = title.isNotBlank() && linkedHabitId != null
}

@HiltViewModel
class AddEditGoalViewModel @Inject constructor(
    private val goalRepository: GoalRepository,
    habitRepository: HabitRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddEditGoalUiState())
    val uiState = _uiState.asStateFlow()

    val availableHabits: StateFlow<List<Habit>> = habitRepository.observeActiveHabits()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun onTitleChange(value: String) = update { it.copy(title = value) }
    fun onLinkedHabitChange(habitId: Long) = update { it.copy(linkedHabitId = habitId) }
    fun onTargetCompletionsChange(value: Int) = update { it.copy(targetCompletions = value.coerceIn(1, 365)) }

    fun save() {
        val state = _uiState.value
        val habitId = state.linkedHabitId ?: return
        if (!state.isValid) return
        viewModelScope.launch {
            goalRepository.addGoal(
                Goal(
                    title = state.title.trim(),
                    linkedHabitId = habitId,
                    targetCompletions = state.targetCompletions,
                    startDate = LocalDate.now(),
                ),
            )
            _uiState.value = _uiState.value.copy(isSaved = true)
        }
    }

    private fun update(transform: (AddEditGoalUiState) -> AddEditGoalUiState) {
        _uiState.value = transform(_uiState.value)
    }
}
