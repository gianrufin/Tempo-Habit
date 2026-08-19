package com.tempo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tempo.app.domain.model.Mood
import java.time.LocalDate

@Entity(tableName = "mood_entries")
data class MoodEntryEntity(
    @PrimaryKey val date: LocalDate,
    val mood: Mood,
    val note: String,
)
