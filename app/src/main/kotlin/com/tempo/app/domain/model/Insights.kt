package com.tempo.app.domain.model

enum class InsightsPeriod(val days: Int, val label: String) {
    WEEK(7, "Last 7 days"),
    MONTH(30, "Last 30 days"),
}

data class HabitInsight(
    val habit: Habit,
    val scheduledCount: Int,
    val doneCount: Int,
    val excusedCount: Int,
) {
    val completionRatePercent: Int
        get() = if (scheduledCount == 0) 0 else ((doneCount + excusedCount) * 100) / scheduledCount
}

data class InsightsSummary(
    val period: InsightsPeriod,
    val habitInsights: List<HabitInsight>,
    val overallRatePercent: Int,
)
