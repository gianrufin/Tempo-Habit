package com.tempo.app.data.repository

import com.tempo.app.data.local.dao.GoalDao
import com.tempo.app.data.local.dao.HabitCompletionDao
import com.tempo.app.data.local.dao.HabitDao
import com.tempo.app.data.local.entity.GoalEntity
import com.tempo.app.domain.model.Goal
import com.tempo.app.domain.model.GoalWithProgress
import com.tempo.app.domain.model.HabitCompletionStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject

class GoalRepositoryImpl @Inject constructor(
    private val goalDao: GoalDao,
    private val habitDao: HabitDao,
    private val completionDao: HabitCompletionDao,
) : GoalRepository {

    override fun observeActiveGoals(): Flow<List<GoalWithProgress>> =
        combine(goalDao.observeActive(), habitDao.observeActive(), completionDao.observeAll()) { goals, habits, completions ->
            val habitsById = habits.associateBy { it.id }
            val completionsByHabit = completions.groupBy { it.habitId }
            goals.map { entity ->
                val goal = entity.toDomain()
                val linkedHabit = habitsById[goal.linkedHabitId]?.toDomain()
                val completedCount = completionsByHabit[goal.linkedHabitId].orEmpty().count {
                    it.status == HabitCompletionStatus.DONE && !it.date.isBefore(goal.startDate)
                }
                GoalWithProgress(goal, linkedHabit, completedCount)
            }
        }

    override suspend fun getGoal(id: Long): Goal? = goalDao.getById(id)?.toDomain()

    override suspend fun addGoal(goal: Goal): Long = goalDao.insert(goal.toEntity())

    override suspend fun updateGoal(goal: Goal) = goalDao.update(goal.toEntity())

    override suspend fun archiveGoal(id: Long) = goalDao.archive(id)

    private fun GoalEntity.toDomain() = Goal(
        id = id,
        title = title,
        linkedHabitId = linkedHabitId,
        targetCompletions = targetCompletions,
        startDate = startDate,
        deadline = deadline,
        archived = archived,
    )

    private fun Goal.toEntity() = GoalEntity(
        id = id,
        title = title,
        linkedHabitId = linkedHabitId,
        targetCompletions = targetCompletions,
        startDate = startDate,
        deadline = deadline,
        archived = archived,
    )
}
