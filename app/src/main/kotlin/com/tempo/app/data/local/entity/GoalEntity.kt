package com.tempo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate

@Entity(tableName = "goals")
data class GoalEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val title: String,
    val linkedHabitId: Long,
    val targetCompletions: Int,
    val startDate: LocalDate,
    val deadline: LocalDate?,
    val archived: Boolean,
)
