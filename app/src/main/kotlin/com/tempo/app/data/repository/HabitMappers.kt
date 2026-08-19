package com.tempo.app.data.repository

import com.tempo.app.data.local.entity.HabitEntity
import com.tempo.app.domain.model.Habit

fun HabitEntity.toDomain(): Habit = Habit(
    id = id,
    name = name,
    icon = icon,
    colorArgb = colorArgb,
    category = category,
    recurrenceRule = recurrenceRule,
    reminderTimes = reminderTimes,
    streakFreezeAllowance = streakFreezeAllowance,
    graceDays = graceDays,
    timeOfDay = timeOfDay,
    routineId = routineId,
    createdAt = createdAt,
    archived = archived,
    pausedUntil = pausedUntil,
)

fun Habit.toEntity(): HabitEntity = HabitEntity(
    id = id,
    name = name,
    icon = icon,
    colorArgb = colorArgb,
    category = category,
    recurrenceRule = recurrenceRule,
    reminderTimes = reminderTimes,
    streakFreezeAllowance = streakFreezeAllowance,
    graceDays = graceDays,
    timeOfDay = timeOfDay,
    routineId = routineId,
    createdAt = createdAt,
    archived = archived,
    pausedUntil = pausedUntil,
)
