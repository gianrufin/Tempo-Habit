package com.tempo.app.domain

import com.tempo.app.domain.model.RecurrenceRule
import java.time.LocalDate
import java.time.temporal.WeekFields
import java.util.Locale

/**
 * Decides whether a habit is scheduled on a given date. [TimesPerWeek] is intentionally
 * "always eligible" here — it has no fixed days, so the caller (repository) decides whether
 * to keep showing it based on how many completions the week already has.
 */
object RecurrenceEngine {

    fun isScheduledOn(rule: RecurrenceRule, date: LocalDate): Boolean = when (rule) {
        is RecurrenceRule.Daily -> true
        is RecurrenceRule.SpecificWeekdays -> date.dayOfWeek in rule.weekdays
        is RecurrenceRule.EveryNDays -> {
            val diff = date.toEpochDay() - rule.anchorEpochDay
            rule.n > 0 && Math.floorMod(diff, rule.n.toLong()) == 0L
        }
        is RecurrenceRule.TimesPerWeek -> true
        is RecurrenceRule.MonthlyByDate -> {
            val lastDayOfMonth = date.lengthOfMonth()
            date.dayOfMonth == minOf(rule.dayOfMonth, lastDayOfMonth)
        }
    }

    /** Whether a [RecurrenceRule.TimesPerWeek] habit still needs completions for the week containing [date]. */
    fun weekNeedsMoreCompletions(rule: RecurrenceRule.TimesPerWeek, completionsThisWeek: Int): Boolean =
        completionsThisWeek < rule.times

    fun weekFieldsSundayStart(): WeekFields = WeekFields.of(Locale.getDefault())

    fun startOfWeek(date: LocalDate): LocalDate {
        val weekFields = weekFieldsSundayStart()
        return date.with(weekFields.dayOfWeek(), 1L)
    }
}
