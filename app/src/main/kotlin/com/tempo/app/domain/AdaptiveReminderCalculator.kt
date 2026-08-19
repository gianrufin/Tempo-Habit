package com.tempo.app.domain

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId

/**
 * Nudges a habit's reminder toward when the user actually tends to complete it, instead of
 * sticking rigidly to the time they set when creating the habit. Falls back to the configured
 * time until there's enough completion history to trust an average.
 */
object AdaptiveReminderCalculator {

    fun suggestTime(
        recentCompletionTimestamps: List<Instant>,
        fallback: LocalTime,
        zoneId: ZoneId = ZoneId.systemDefault(),
        minSamples: Int = 3,
    ): LocalTime {
        if (recentCompletionTimestamps.size < minSamples) return fallback
        val averageSecondOfDay = recentCompletionTimestamps
            .map { it.atZone(zoneId).toLocalTime().toSecondOfDay() }
            .average()
            .toInt()
        return LocalTime.ofSecondOfDay(averageSecondOfDay.toLong())
    }
}
