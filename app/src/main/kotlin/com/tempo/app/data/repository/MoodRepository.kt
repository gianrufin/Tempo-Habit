package com.tempo.app.data.repository

import com.tempo.app.domain.model.Mood
import com.tempo.app.domain.model.MoodEntry
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

interface MoodRepository {
    fun observeForDate(date: LocalDate): Flow<MoodEntry?>
    fun observeInRange(start: LocalDate, end: LocalDate): Flow<List<MoodEntry>>
    suspend fun setMood(date: LocalDate, mood: Mood, note: String = "")
}
