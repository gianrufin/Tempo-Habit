package com.tempo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.TaskPriority
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val title: String,
    val notes: String,
    val isRecurring: Boolean,
    val recurrenceRule: RecurrenceRule?,
    val dueDate: LocalDate?,
    val reminderTime: LocalTime?,
    val priority: TaskPriority,
    val createdAt: LocalDate,
    val archived: Boolean,
    val completedAt: Instant?,
)
