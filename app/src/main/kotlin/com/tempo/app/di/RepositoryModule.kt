package com.tempo.app.di

import com.tempo.app.data.repository.GoalRepository
import com.tempo.app.data.repository.GoalRepositoryImpl
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.data.repository.HabitRepositoryImpl
import com.tempo.app.data.repository.MoodRepository
import com.tempo.app.data.repository.MoodRepositoryImpl
import com.tempo.app.data.repository.TaskRepository
import com.tempo.app.data.repository.TaskRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindHabitRepository(impl: HabitRepositoryImpl): HabitRepository

    @Binds
    @Singleton
    abstract fun bindTaskRepository(impl: TaskRepositoryImpl): TaskRepository

    @Binds
    @Singleton
    abstract fun bindMoodRepository(impl: MoodRepositoryImpl): MoodRepository

    @Binds
    @Singleton
    abstract fun bindGoalRepository(impl: GoalRepositoryImpl): GoalRepository
}
