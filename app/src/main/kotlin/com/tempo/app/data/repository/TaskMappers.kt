package com.tempo.app.data.repository

import com.tempo.app.data.local.entity.TaskChecklistItemEntity
import com.tempo.app.data.local.entity.TaskEntity
import com.tempo.app.domain.model.Task
import com.tempo.app.domain.model.TaskChecklistItem

fun TaskEntity.toDomain(): Task = Task(
    id = id,
    title = title,
    notes = notes,
    isRecurring = isRecurring,
    recurrenceRule = recurrenceRule,
    dueDate = dueDate,
    reminderTime = reminderTime,
    priority = priority,
    createdAt = createdAt,
    archived = archived,
    completedAt = completedAt,
)

fun TaskChecklistItemEntity.toDomain(): TaskChecklistItem = TaskChecklistItem(
    id = id,
    taskId = taskId,
    label = label,
    done = done,
    sortOrder = sortOrder,
)

fun TaskChecklistItem.toEntity(): TaskChecklistItemEntity = TaskChecklistItemEntity(
    id = id,
    taskId = taskId,
    label = label,
    done = done,
    sortOrder = sortOrder,
)

fun Task.toEntity(): TaskEntity = TaskEntity(
    id = id,
    title = title,
    notes = notes,
    isRecurring = isRecurring,
    recurrenceRule = recurrenceRule,
    dueDate = dueDate,
    reminderTime = reminderTime,
    priority = priority,
    createdAt = createdAt,
    archived = archived,
    completedAt = completedAt,
)
