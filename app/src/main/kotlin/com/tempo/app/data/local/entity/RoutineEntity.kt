package com.tempo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tempo.app.domain.model.TimeOfDay
import java.time.LocalDate

@Entity(tableName = "routines")
data class RoutineEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val name: String,
    val icon: String,
    val timeOfDay: TimeOfDay,
    val createdAt: LocalDate,
    val archived: Boolean,
)
