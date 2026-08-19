package com.tempo.app.data.repository

import com.tempo.app.domain.model.Task
import com.tempo.app.domain.model.TaskChecklistItem
import com.tempo.app.domain.model.TaskWithTodayStatus
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

interface TaskRepository {
    /** Recurring tasks scheduled for [date], plus single tasks not yet completed and due on or before [date]. */
    fun observeTasksForDate(date: LocalDate): Flow<List<TaskWithTodayStatus>>
    fun observeAllActiveTasks(): Flow<List<Task>>
    suspend fun getAllActiveTasks(): List<Task>
    suspend fun isDoneForDate(taskId: Long, date: LocalDate): Boolean
    suspend fun getTask(id: Long): Task?
    suspend fun addTask(task: Task): Long
    suspend fun updateTask(task: Task)
    suspend fun archiveTask(id: Long)

    /** Toggles completion for [date]: for recurring tasks this is per-day; for single tasks it flips [Task.completedAt]. */
    suspend fun toggleTaskDone(taskId: Long, date: LocalDate)

    fun observeChecklist(taskId: Long): Flow<List<TaskChecklistItem>>
    suspend fun getChecklist(taskId: Long): List<TaskChecklistItem>

    /** Replaces the entire checklist for [taskId] with [items], in order. */
    suspend fun replaceChecklist(taskId: Long, items: List<TaskChecklistItem>)
}
