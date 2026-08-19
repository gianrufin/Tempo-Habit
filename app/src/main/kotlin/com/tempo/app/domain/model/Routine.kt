package com.tempo.app.domain.model

import java.time.LocalDate

/** A "macro" grouping of several "micro" habits that are typically done together, e.g. a Morning Routine. */
data class Routine(
    val id: Long = 0L,
    val name: String,
    val icon: String,
    val timeOfDay: TimeOfDay,
    val createdAt: LocalDate = LocalDate.now(),
    val archived: Boolean = false,
)

/** A routine bundled with the resolved status of each of its habits for a given day. */
data class RoutineWithHabits(
    val routine: Routine,
    val habits: List<HabitWithTodayStatus>,
) {
    val isFullyComplete: Boolean
        get() = habits.isNotEmpty() && habits.all {
            it.status == HabitCompletionStatus.DONE || it.status == HabitCompletionStatus.SKIPPED_EXCUSED
        }
}
