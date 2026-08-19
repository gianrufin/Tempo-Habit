package com.tempo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.TimeOfDay
import java.time.LocalDate
import java.time.LocalTime

@Entity(tableName = "habits")
data class HabitEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val name: String,
    val icon: String,
    val colorArgb: Long,
    val category: String?,
    val recurrenceRule: RecurrenceRule,
    val reminderTimes: List<LocalTime>,
    val streakFreezeAllowance: Int,
    val graceDays: Int,
    val timeOfDay: TimeOfDay = TimeOfDay.MORNING,
    val routineId: Long? = null,
    val createdAt: LocalDate,
    val archived: Boolean,
    val pausedUntil: LocalDate? = null,
)
