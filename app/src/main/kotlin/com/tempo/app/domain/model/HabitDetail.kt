package com.tempo.app.domain.model

import java.time.LocalDate

data class HeatmapDay(
    val date: LocalDate,
    val scheduled: Boolean,
    val status: HabitCompletionStatus?,
)

data class HabitDetail(
    val habit: Habit,
    val currentStreak: Int,
    val bestStreak: Int,
    val completionRatePercent: Int,
    val heatmap: List<HeatmapDay>,
)

/** Aggregate across all habits for one calendar day, used by the month Calendar screen. */
data class DayAggregate(
    val date: LocalDate,
    val scheduledCount: Int,
    val doneCount: Int,
    val excusedCount: Int,
) {
    val isFullyComplete: Boolean get() = scheduledCount > 0 && doneCount + excusedCount >= scheduledCount
    val completionFraction: Float
        get() = if (scheduledCount == 0) 0f else (doneCount + excusedCount).toFloat() / scheduledCount
}
