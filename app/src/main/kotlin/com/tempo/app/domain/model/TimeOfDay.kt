package com.tempo.app.domain.model

import java.time.LocalTime

enum class TimeOfDay(val label: String) {
    MORNING("Morning"),
    AFTERNOON("Afternoon"),
    EVENING("Evening"),
    NIGHT("Night"),
    ;

    companion object {
        fun forCurrentTime(time: LocalTime = LocalTime.now()): TimeOfDay = when (time.hour) {
            in 5..11 -> MORNING
            in 12..16 -> AFTERNOON
            in 17..20 -> EVENING
            else -> NIGHT
        }
    }
}
