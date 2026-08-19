package com.tempo.app.data.repository

import com.tempo.app.domain.model.DayAggregate
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.HabitDetail
import com.tempo.app.domain.model.HabitWithTodayStatus
import com.tempo.app.domain.model.InsightsPeriod
import com.tempo.app.domain.model.InsightsSummary
import com.tempo.app.domain.model.Routine
import kotlinx.coroutines.flow.Flow
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth

interface HabitRepository {
    fun observeActiveHabits(): Flow<List<Habit>>
    fun observeHabitsForDate(date: LocalDate): Flow<List<HabitWithTodayStatus>>
    suspend fun getAllActiveHabits(): List<Habit>
    suspend fun getCompletionStatus(habitId: Long, date: LocalDate): HabitCompletionStatus?
    suspend fun getRecentDoneTimestamps(habitId: Long, limit: Int = 10): List<Instant>
    suspend fun getHabit(id: Long): Habit?
    suspend fun addHabit(habit: Habit): Long
    suspend fun updateHabit(habit: Habit)
    suspend fun archiveHabit(id: Long)

    /** Cycles a habit's status for [date]: none -> done -> excused (if freezes remain) -> none. */
    suspend fun cycleCompletion(habitId: Long, date: LocalDate)

    /** Unconditionally marks [date] as done, e.g. when a linked Pomodoro session completes. */
    suspend fun markDone(habitId: Long, date: LocalDate)

    /** Directly marks [date] as an excused/frozen day, if the habit has freezes left this week. */
    suspend fun markExcused(habitId: Long, date: LocalDate)

    /** Streak, completion rate, and a trailing heatmap for a single habit's detail screen. */
    fun observeHabitDetail(habitId: Long, heatmapDays: Int = 98): Flow<HabitDetail?>

    /** Per-day scheduled/done/excused counts across all habits, for the month Calendar screen. */
    fun observeMonthAggregate(month: YearMonth): Flow<List<DayAggregate>>

    /** Per-day scheduled/done/excused counts across all habits, for an arbitrary set of dates (e.g. the Today day-strip). */
    fun observeAggregatesForDates(dates: List<LocalDate>): Flow<List<DayAggregate>>

    /** Rolling completion-rate summary across all habits for [period]. */
    fun observeInsights(period: InsightsPeriod): Flow<InsightsSummary>

    /** All habits (including archived) and their full completion history, as CSV text. */
    suspend fun exportAllCompletionsCsv(): String

    fun observeActiveRoutines(): Flow<List<Routine>>
    suspend fun getRoutine(id: Long): Routine?
    suspend fun addRoutine(routine: Routine): Long
    suspend fun updateRoutine(routine: Routine)
    suspend fun archiveRoutine(id: Long)
}
