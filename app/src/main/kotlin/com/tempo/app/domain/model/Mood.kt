package com.tempo.app.domain.model

import java.time.LocalDate

enum class Mood(val emoji: String) {
    AWFUL("😞"),
    LOW("😕"),
    OKAY("😐"),
    GOOD("🙂"),
    GREAT("😄"),
}

data class MoodEntry(
    val date: LocalDate,
    val mood: Mood,
    val note: String = "",
)
