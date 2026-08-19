package com.tempo.app.di

import android.content.Context
import androidx.room.Room
import com.tempo.app.data.local.Migrations
import com.tempo.app.data.local.TempoDatabase
import com.tempo.app.data.local.dao.GoalDao
import com.tempo.app.data.local.dao.HabitCompletionDao
import com.tempo.app.data.local.dao.HabitDao
import com.tempo.app.data.local.dao.MoodEntryDao
import com.tempo.app.data.local.dao.RoutineDao
import com.tempo.app.data.local.dao.TaskChecklistItemDao
import com.tempo.app.data.local.dao.TaskCompletionDao
import com.tempo.app.data.local.dao.TaskDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideTempoDatabase(@ApplicationContext context: Context): TempoDatabase =
        Room.databaseBuilder(context, TempoDatabase::class.java, TempoDatabase.DATABASE_NAME)
            // Real migrations so an app update never silently wipes a user's habits/tasks again —
            // only a genuine downgrade (installing an older build over a newer database) falls
            // back to a destructive reset, since there's no sane way to migrate backwards.
            .addMigrations(*Migrations.ALL)
            .fallbackToDestructiveMigrationOnDowngrade()
            .build()

    @Provides
    fun provideHabitDao(database: TempoDatabase): HabitDao = database.habitDao()

    @Provides
    fun provideHabitCompletionDao(database: TempoDatabase): HabitCompletionDao = database.habitCompletionDao()

    @Provides
    fun provideRoutineDao(database: TempoDatabase): RoutineDao = database.routineDao()

    @Provides
    fun provideTaskDao(database: TempoDatabase): TaskDao = database.taskDao()

    @Provides
    fun provideTaskCompletionDao(database: TempoDatabase): TaskCompletionDao = database.taskCompletionDao()

    @Provides
    fun provideMoodEntryDao(database: TempoDatabase): MoodEntryDao = database.moodEntryDao()

    @Provides
    fun provideGoalDao(database: TempoDatabase): GoalDao = database.goalDao()

    @Provides
    fun provideTaskChecklistItemDao(database: TempoDatabase): TaskChecklistItemDao = database.taskChecklistItemDao()
}
