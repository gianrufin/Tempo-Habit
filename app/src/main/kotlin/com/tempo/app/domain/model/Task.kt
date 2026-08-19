package com.tempo.app.domain.model

import java.time.LocalDate
import java.time.LocalTime

/**
 * A one-off ([isRecurring] = false, tracked via [dueDate]/[completedAt]) or recurring
 * ([recurrenceRule] non-null, tracked per-day via [com.tempo.app.data.local.entity.TaskCompletionEntity])
 * to-do item, distinct from [Habit] in that it's a to-do to clear rather than a streak to keep.
 */
data class Task(
    val id: Long = 0L,
    val title: String,
    val notes: String = "",
    val isRecurring: Boolean,
    val recurrenceRule: RecurrenceRule? = null,
    val dueDate: LocalDate? = null,
    val reminderTime: LocalTime? = null,
    val priority: TaskPriority = TaskPriority.MEDIUM,
    val createdAt: LocalDate,
    val archived: Boolean = false,
    val completedAt: java.time.Instant? = null,
)

data class TaskWithTodayStatus(
    val task: Task,
    val isDoneForDate: Boolean,
)
