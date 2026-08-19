package com.tempo.app.domain

import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.RecurrenceRule
import java.time.LocalDate

/**
 * Walks a habit's whole history to compute its current and best streak. A day that was
 * [HabitCompletionStatus.SKIPPED_EXCUSED] (a streak freeze) keeps the streak alive without
 * counting as an extra completion — only an actual [HabitCompletionStatus.MISSED]/unrecorded
 * scheduled day in the past breaks it. Today never breaks a streak on its own, since it may
 * simply not be completed yet.
 */
object StreakCalculator {

    data class Result(val current: Int, val best: Int)

    fun calculate(
        rule: RecurrenceRule,
        createdAt: LocalDate,
        completions: Map<LocalDate, HabitCompletionStatus>,
        today: LocalDate,
    ): Result {
        if (today.isBefore(createdAt)) return Result(0, 0)

        var running = 0
        var best = 0
        val weeklyDoneCount = mutableMapOf<LocalDate, Int>()

        var date = createdAt
        while (!date.isAfter(today)) {
            val scheduled = if (rule is RecurrenceRule.TimesPerWeek) {
                val weekStart = RecurrenceEngine.startOfWeek(date)
                weeklyDoneCount.getOrDefault(weekStart, 0) < rule.times
            } else {
                RecurrenceEngine.isScheduledOn(rule, date)
            }

            if (scheduled) {
                when (completions[date]) {
                    HabitCompletionStatus.DONE -> {
                        running += 1
                        if (rule is RecurrenceRule.TimesPerWeek) {
                            val weekStart = RecurrenceEngine.startOfWeek(date)
                            weeklyDoneCount[weekStart] = weeklyDoneCount.getOrDefault(weekStart, 0) + 1
                        }
                    }
                    HabitCompletionStatus.SKIPPED_EXCUSED -> Unit
                    HabitCompletionStatus.MISSED, null -> {
                        if (date.isBefore(today)) running = 0
                    }
                }
            }
            if (running > best) best = running
            date = date.plusDays(1)
        }
        return Result(current = running, best = best)
    }
}
