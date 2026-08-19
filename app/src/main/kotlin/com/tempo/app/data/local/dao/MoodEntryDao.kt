package com.tempo.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tempo.app.data.local.entity.MoodEntryEntity
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

@Dao
interface MoodEntryDao {
    @Query("SELECT * FROM mood_entries WHERE date = :date LIMIT 1")
    fun observeForDate(date: LocalDate): Flow<MoodEntryEntity?>

    @Query("SELECT * FROM mood_entries WHERE date BETWEEN :start AND :end ORDER BY date ASC")
    fun observeInRange(start: LocalDate, end: LocalDate): Flow<List<MoodEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entry: MoodEntryEntity)
}
