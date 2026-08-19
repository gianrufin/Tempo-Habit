package com.tempo.app.domain.model

import java.time.LocalDate

/** A longer-horizon objective tracked via how many times its linked habit has been completed since it started. */
data class Goal(
    val id: Long = 0L,
    val title: String,
    val linkedHabitId: Long,
    val targetCompletions: Int,
    val startDate: LocalDate,
    val deadline: LocalDate? = null,
    val archived: Boolean = false,
)

data class GoalWithProgress(
    val goal: Goal,
    val linkedHabit: Habit?,
    val completions: Int,
) {
    val progressFraction: Float
        get() = if (goal.targetCompletions == 0) 0f else (completions.toFloat() / goal.targetCompletions).coerceIn(0f, 1f)
    val isComplete: Boolean get() = completions >= goal.targetCompletions
}
