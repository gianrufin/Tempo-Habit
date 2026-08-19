package com.tempo.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.DayOfWeek

/**
 * How often a habit is expected. Stored as JSON on [com.tempo.app.data.local.entity.HabitEntity]
 * via [com.tempo.app.data.local.Converters] so new rule types can be added without a migration
 * that touches every column.
 */
@Serializable
sealed class RecurrenceRule {
    @Serializable
    @SerialName("daily")
    data object Daily : RecurrenceRule()

    @Serializable
    @SerialName("specific_weekdays")
    data class SpecificWeekdays(val weekdays: Set<DayOfWeek>) : RecurrenceRule()

    /** Every [n] days, counted from [anchorEpochDay]. */
    @Serializable
    @SerialName("every_n_days")
    data class EveryNDays(val n: Int, val anchorEpochDay: Long) : RecurrenceRule()

    /** Flexible: [times] completions somewhere in the week, no fixed days. */
    @Serializable
    @SerialName("times_per_week")
    data class TimesPerWeek(val times: Int) : RecurrenceRule()

    @Serializable
    @SerialName("monthly_by_date")
    data class MonthlyByDate(val dayOfMonth: Int) : RecurrenceRule()
}
