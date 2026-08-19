package com.tempo.app.data.repository

import com.tempo.app.data.local.entity.RoutineEntity
import com.tempo.app.domain.model.Routine

fun RoutineEntity.toDomain(): Routine = Routine(
    id = id,
    name = name,
    icon = icon,
    timeOfDay = timeOfDay,
    createdAt = createdAt,
    archived = archived,
)

fun Routine.toEntity(): RoutineEntity = RoutineEntity(
    id = id,
    name = name,
    icon = icon,
    timeOfDay = timeOfDay,
    createdAt = createdAt,
    archived = archived,
)
