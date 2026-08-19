package com.tempo.app.ui.screens.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.data.repository.TaskRepository
import com.tempo.app.domain.model.TaskWithTodayStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class TaskListUiState(
    val recurringTasks: List<TaskWithTodayStatus> = emptyList(),
    val singleTasks: List<TaskWithTodayStatus> = emptyList(),
) {
    val isEmpty: Boolean get() = recurringTasks.isEmpty() && singleTasks.isEmpty()
}

@HiltViewModel
class TaskListViewModel @Inject constructor(
    private val repository: TaskRepository,
) : ViewModel() {

    private val today = LocalDate.now()

    val uiState = repository.observeTasksForDate(today)
        .map { tasks ->
            TaskListUiState(
                recurringTasks = tasks.filter { it.task.isRecurring },
                singleTasks = tasks.filter { !it.task.isRecurring },
            )
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), TaskListUiState())

    fun onToggleTask(taskId: Long) {
        viewModelScope.launch { repository.toggleTaskDone(taskId, today) }
    }

    fun onArchiveTask(taskId: Long) {
        viewModelScope.launch { repository.archiveTask(taskId) }
    }
}
