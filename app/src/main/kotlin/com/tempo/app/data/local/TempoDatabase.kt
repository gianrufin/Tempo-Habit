package com.tempo.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.tempo.app.data.local.dao.HabitCompletionDao
import com.tempo.app.data.local.dao.HabitDao
import com.tempo.app.data.local.dao.RoutineDao
import com.tempo.app.data.local.dao.GoalDao
import com.tempo.app.data.local.dao.MoodEntryDao
import com.tempo.app.data.local.dao.TaskChecklistItemDao
import com.tempo.app.data.local.dao.TaskCompletionDao
import com.tempo.app.data.local.dao.TaskDao
import com.tempo.app.data.local.entity.GoalEntity
import com.tempo.app.data.local.entity.HabitCompletionEntity
import com.tempo.app.data.local.entity.HabitEntity
import com.tempo.app.data.local.entity.MoodEntryEntity
import com.tempo.app.data.local.entity.RoutineEntity
import com.tempo.app.data.local.entity.TaskChecklistItemEntity
import com.tempo.app.data.local.entity.TaskCompletionEntity
import com.tempo.app.data.local.entity.TaskEntity

@Database(
    entities = [
        HabitEntity::class,
        HabitCompletionEntity::class,
        RoutineEntity::class,
        TaskEntity::class,
        TaskCompletionEntity::class,
        MoodEntryEntity::class,
        GoalEntity::class,
        TaskChecklistItemEntity::class,
    ],
    version = 6,
    exportSchema = false,
)
@TypeConverters(Converters::class)
abstract class TempoDatabase : RoomDatabase() {
    abstract fun habitDao(): HabitDao
    abstract fun habitCompletionDao(): HabitCompletionDao
    abstract fun routineDao(): RoutineDao
    abstract fun taskDao(): TaskDao
    abstract fun taskCompletionDao(): TaskCompletionDao
    abstract fun moodEntryDao(): MoodEntryDao
    abstract fun goalDao(): GoalDao
    abstract fun taskChecklistItemDao(): TaskChecklistItemDao

    companion object {
        const val DATABASE_NAME = "tempo.db"
    }
}
