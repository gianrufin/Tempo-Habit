package com.tempo.app.data.repository

import com.tempo.app.data.local.dao.MoodEntryDao
import com.tempo.app.data.local.entity.MoodEntryEntity
import com.tempo.app.domain.model.Mood
import com.tempo.app.domain.model.MoodEntry
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate
import javax.inject.Inject

class MoodRepositoryImpl @Inject constructor(
    private val dao: MoodEntryDao,
) : MoodRepository {

    override fun observeForDate(date: LocalDate): Flow<MoodEntry?> =
        dao.observeForDate(date).map { it?.toDomain() }

    override fun observeInRange(start: LocalDate, end: LocalDate): Flow<List<MoodEntry>> =
        dao.observeInRange(start, end).map { entries -> entries.map { it.toDomain() } }

    override suspend fun setMood(date: LocalDate, mood: Mood, note: String) {
        dao.upsert(MoodEntryEntity(date = date, mood = mood, note = note))
    }

    private fun MoodEntryEntity.toDomain() = MoodEntry(date = date, mood = mood, note = note)
}
