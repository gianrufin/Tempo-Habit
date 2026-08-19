package com.tempo.app.domain.model

/** A curated one-tap starting point for a common habit, offered from Today's "Quick add" menu. */
data class HabitTemplate(
    val name: String,
    val icon: String,
    val colorArgb: Long,
)

val QUICK_ADD_TEMPLATES = listOf(
    HabitTemplate("Drink water", "💧", 0xFF4FC3F7L),
    HabitTemplate("Morning walk", "🏃", 0xFF386A20L),
    HabitTemplate("Read 10 pages", "📚", 0xFF6750A4L),
    HabitTemplate("Meditate", "🧘", 0xFF7D5260L),
    HabitTemplate("Sleep by 11pm", "🛌", 0xFFB3261EL),
    HabitTemplate("Journal", "✍️", 0xFFFF7A45L),
    HabitTemplate("Eat a vegetable", "🥗", 0xFF386A20L),
    HabitTemplate("Stretch", "💪", 0xFF6750A4L),
    HabitTemplate("Walk the dog", "🐕", 0xFFFF7A45L),
)
