package com.tempo.app.data.repository

import com.tempo.app.domain.model.Goal
import com.tempo.app.domain.model.GoalWithProgress
import kotlinx.coroutines.flow.Flow

interface GoalRepository {
    fun observeActiveGoals(): Flow<List<GoalWithProgress>>
    suspend fun getGoal(id: Long): Goal?
    suspend fun addGoal(goal: Goal): Long
    suspend fun updateGoal(goal: Goal)
    suspend fun archiveGoal(id: Long)
}
