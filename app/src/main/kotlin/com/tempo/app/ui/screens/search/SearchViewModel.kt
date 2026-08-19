package com.tempo.app.ui.screens.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.data.repository.TaskRepository
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.Task
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

data class SearchResults(
    val habits: List<Habit> = emptyList(),
    val tasks: List<Task> = emptyList(),
) {
    val isEmpty: Boolean get() = habits.isEmpty() && tasks.isEmpty()
}

@HiltViewModel
class SearchViewModel @Inject constructor(
    habitRepository: HabitRepository,
    taskRepository: TaskRepository,
) : ViewModel() {

    private val _query = MutableStateFlow("")
    val query: StateFlow<String> = _query.asStateFlow()

    private val allHabits = habitRepository.observeActiveHabits()
    private val allTasks = taskRepository.observeAllActiveTasks()

    val results: StateFlow<SearchResults> = combine(_query, allHabits, allTasks) { query, habits, tasks ->
        if (query.isBlank()) {
            SearchResults()
        } else {
            val needle = query.trim()
            SearchResults(
                habits = habits.filter { it.name.contains(needle, ignoreCase = true) },
                tasks = tasks.filter {
                    it.title.contains(needle, ignoreCase = true) || it.notes.contains(needle, ignoreCase = true)
                },
            )
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SearchResults())

    fun onQueryChange(value: String) {
        _query.value = value
    }
}
