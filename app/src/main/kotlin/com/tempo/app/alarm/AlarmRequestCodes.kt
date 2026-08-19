package com.tempo.app.alarm

/** Stable AlarmManager/PendingIntent request codes, shared between scheduling and cancellation. */
object AlarmRequestCodes {
    const val MAX_HABIT_REMINDER_SLOTS = 8
    const val TIMER = 555_001
    const val TEST = 555_002

    fun habit(habitId: Long, slot: Int): Int = "habit-$habitId-$slot".hashCode()

    fun task(taskId: Long): Int = "task-$taskId".hashCode()
}
