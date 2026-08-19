package com.tempo.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.tempo.app.data.local.entity.HabitCompletionEntity
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

@Dao
interface HabitCompletionDao {
    @Query(
        "SELECT * FROM habit_completions WHERE date BETWEEN :start AND :end",
    )
    fun observeInRange(start: LocalDate, end: LocalDate): Flow<List<HabitCompletionEntity>>

    @Query("SELECT * FROM habit_completions WHERE habitId = :habitId")
    fun observeForHabit(habitId: Long): Flow<List<HabitCompletionEntity>>

    @Query("SELECT * FROM habit_completions WHERE habitId = :habitId")
    suspend fun getAllForHabit(habitId: Long): List<HabitCompletionEntity>

    @Query("SELECT * FROM habit_completions WHERE habitId = :habitId AND date = :date LIMIT 1")
    suspend fun getForHabitAndDate(habitId: Long, date: LocalDate): HabitCompletionEntity?

    @Query("SELECT * FROM habit_completions WHERE habitId = :habitId AND date BETWEEN :start AND :end")
    suspend fun getForHabitInRange(habitId: Long, start: LocalDate, end: LocalDate): List<HabitCompletionEntity>

    @Query("SELECT * FROM habit_completions")
    fun observeAll(): Flow<List<HabitCompletionEntity>>

    @Query("SELECT * FROM habit_completions ORDER BY habitId ASC, date ASC")
    suspend fun getAll(): List<HabitCompletionEntity>

    @Query(
        "SELECT * FROM habit_completions WHERE habitId = :habitId AND status = 'DONE' " +
            "ORDER BY date DESC LIMIT :limit",
    )
    suspend fun getRecentDone(habitId: Long, limit: Int): List<HabitCompletionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(completion: HabitCompletionEntity)

    @Query("DELETE FROM habit_completions WHERE habitId = :habitId AND date = :date")
    suspend fun delete(habitId: Long, date: LocalDate)
}
