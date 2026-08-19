package com.tempo.app.di

import com.tempo.app.data.repository.HabitRepository
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * GlanceAppWidget and its ActionCallbacks aren't Hilt entry points (unlike Activity/Receiver/
 * ViewModel), so they can't @Inject directly. This lets them pull the singleton repository out
 * of the Application context instead.
 */
@EntryPoint
@InstallIn(SingletonComponent::class)
interface WidgetEntryPoint {
    fun habitRepository(): HabitRepository
}
