package com.tempo.app.data.repository

import com.tempo.app.data.local.dao.HabitCompletionDao
import com.tempo.app.data.local.dao.HabitDao
import com.tempo.app.data.local.dao.RoutineDao
import com.tempo.app.data.local.entity.HabitCompletionEntity
import com.tempo.app.domain.RecurrenceEngine
import com.tempo.app.domain.StreakCalculator
import com.tempo.app.domain.model.DayAggregate
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.HabitDetail
import com.tempo.app.domain.model.HabitInsight
import com.tempo.app.domain.model.HabitWithTodayStatus
import com.tempo.app.domain.model.HeatmapDay
import com.tempo.app.domain.model.InsightsPeriod
import com.tempo.app.domain.model.InsightsSummary
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.Routine
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import javax.inject.Inject

class HabitRepositoryImpl @Inject constructor(
    private val habitDao: HabitDao,
    private val completionDao: HabitCompletionDao,
    private val routineDao: RoutineDao,
) : HabitRepository {

    override fun observeActiveHabits(): Flow<List<Habit>> =
        habitDao.observeActive().map { entities -> entities.map { it.toDomain() } }

    override fun observeHabitsForDate(date: LocalDate): Flow<List<HabitWithTodayStatus>> =
        combine(habitDao.observeActive(), completionDao.observeAll()) { entities, completions ->
            val completionsByHabit = completions.groupBy { it.habitId }
            entities.mapNotNull { entity ->
                val habit = entity.toDomain()
                val completionsByDate = completionsByHabit[entity.id].orEmpty()
                    .associate { it.date to it.status }
                buildStatusForDate(habit, date, completionsByDate)
            }
        }

    private fun buildStatusForDate(
        habit: Habit,
        date: LocalDate,
        completionsByDate: Map<LocalDate, HabitCompletionStatus>,
    ): HabitWithTodayStatus? {
        if (date.isBefore(habit.createdAt)) return null

        val scheduledToday = isEffectivelyScheduled(habit, date, completionsByDate)
        val statusToday = completionsByDate[date]

        var overdue = false
        for (daysBack in 1..habit.graceDays) {
            val pastDate = date.minusDays(daysBack.toLong())
            if (pastDate.isBefore(habit.createdAt)) continue
            val wasScheduled = isEffectivelyScheduled(habit, pastDate, completionsByDate)
            val wasSatisfied = completionsByDate[pastDate].let {
                it == HabitCompletionStatus.DONE || it == HabitCompletionStatus.SKIPPED_EXCUSED
            }
            if (wasScheduled && !wasSatisfied) {
                overdue = true
                break
            }
        }

        if (!scheduledToday && statusToday == null && !overdue) return null

        val streak = StreakCalculator.calculate(habit.recurrenceRule, habit.createdAt, completionsByDate, date)
        val weekStart = RecurrenceEngine.startOfWeek(date)
        val excusedThisWeek = completionsByDate.count { (d, status) ->
            status == HabitCompletionStatus.SKIPPED_EXCUSED && RecurrenceEngine.startOfWeek(d) == weekStart
        }
        val freezesRemaining = (habit.streakFreezeAllowance - excusedThisWeek).coerceAtLeast(0)

        return HabitWithTodayStatus(
            habit = habit,
            forDate = date,
            status = statusToday,
            isOverdue = overdue,
            currentStreak = streak.current,
            bestStreak = streak.best,
            freezesRemainingThisWeek = freezesRemaining,
        )
    }

    private fun isEffectivelyScheduled(
        habit: Habit,
        date: LocalDate,
        completionsByDate: Map<LocalDate, HabitCompletionStatus>,
    ): Boolean {
        val rule = habit.recurrenceRule
        if (date.isBefore(habit.createdAt)) return false
        if (habit.pausedUntil != null && date.isBefore(habit.pausedUntil)) return false
        if (rule !is RecurrenceRule.TimesPerWeek) return RecurrenceEngine.isScheduledOn(rule, date)

        val weekStart = RecurrenceEngine.startOfWeek(date)
        if (completionsByDate[date] == HabitCompletionStatus.DONE) return true
        val doneBeforeDate = completionsByDate.count { (d, status) ->
            status == HabitCompletionStatus.DONE && RecurrenceEngine.startOfWeek(d) == weekStart && d.isBefore(date)
        }
        return doneBeforeDate < rule.times
    }

    override suspend fun getAllActiveHabits(): List<Habit> = habitDao.getAllActive().map { it.toDomain() }

    override suspend fun getCompletionStatus(habitId: Long, date: LocalDate): HabitCompletionStatus? =
        completionDao.getForHabitAndDate(habitId, date)?.status

    override suspend fun getRecentDoneTimestamps(habitId: Long, limit: Int): List<Instant> =
        completionDao.getRecentDone(habitId, limit).mapNotNull { it.completedAt }

    override suspend fun getHabit(id: Long): Habit? = habitDao.getById(id)?.toDomain()

    override suspend fun addHabit(habit: Habit): Long = habitDao.insert(habit.toEntity())

    override suspend fun updateHabit(habit: Habit) = habitDao.update(habit.toEntity())

    override suspend fun archiveHabit(id: Long) = habitDao.archive(id)

    override suspend fun cycleCompletion(habitId: Long, date: LocalDate) {
        val existing = completionDao.getForHabitAndDate(habitId, date)
        when (existing?.status) {
            null -> completionDao.upsert(
                HabitCompletionEntity(
                    habitId = habitId,
                    date = date,
                    status = HabitCompletionStatus.DONE,
                    completedAt = Instant.now(),
                ),
            )
            HabitCompletionStatus.DONE -> {
                if (freezesRemaining(habitId, date) > 0) {
                    completionDao.upsert(existing.copy(status = HabitCompletionStatus.SKIPPED_EXCUSED, completedAt = null))
                } else {
                    completionDao.delete(habitId, date)
                }
            }
            HabitCompletionStatus.SKIPPED_EXCUSED, HabitCompletionStatus.MISSED ->
                completionDao.delete(habitId, date)
        }
    }

    override suspend fun markDone(habitId: Long, date: LocalDate) {
        completionDao.upsert(
            HabitCompletionEntity(
                habitId = habitId,
                date = date,
                status = HabitCompletionStatus.DONE,
                completedAt = Instant.now(),
            ),
        )
    }

    override suspend fun markExcused(habitId: Long, date: LocalDate) {
        if (freezesRemaining(habitId, date) <= 0) return
        completionDao.upsert(
            HabitCompletionEntity(
                habitId = habitId,
                date = date,
                status = HabitCompletionStatus.SKIPPED_EXCUSED,
                completedAt = null,
            ),
        )
    }

    private suspend fun freezesRemaining(habitId: Long, date: LocalDate): Int {
        val habit = habitDao.getById(habitId)?.toDomain() ?: return 0
        val weekStart = RecurrenceEngine.startOfWeek(date)
        val weekEnd = weekStart.plusDays(6)
        val excusedThisWeek = completionDao.getForHabitInRange(habitId, weekStart, weekEnd)
            .count { it.status == HabitCompletionStatus.SKIPPED_EXCUSED }
        return (habit.streakFreezeAllowance - excusedThisWeek).coerceAtLeast(0)
    }

    override fun observeHabitDetail(habitId: Long, heatmapDays: Int): Flow<HabitDetail?> =
        combine(habitDao.observeById(habitId), completionDao.observeForHabit(habitId)) { entity, completions ->
            if (entity == null) return@combine null
            val habit = entity.toDomain()
            val completionsByDate = completions.associate { it.date to it.status }
            val today = LocalDate.now()

            val streak = StreakCalculator.calculate(habit.recurrenceRule, habit.createdAt, completionsByDate, today)

            val rateWindowStart = maxOf(habit.createdAt, today.minusDays(29))
            var scheduledInWindow = 0
            var satisfiedInWindow = 0
            var date = rateWindowStart
            while (!date.isAfter(today)) {
                if (isEffectivelyScheduled(habit, date, completionsByDate)) {
                    scheduledInWindow++
                    if (completionsByDate[date] == HabitCompletionStatus.DONE ||
                        completionsByDate[date] == HabitCompletionStatus.SKIPPED_EXCUSED
                    ) {
                        satisfiedInWindow++
                    }
                }
                date = date.plusDays(1)
            }
            val completionRate = if (scheduledInWindow == 0) 0 else (satisfiedInWindow * 100) / scheduledInWindow

            val heatmapStart = maxOf(habit.createdAt, today.minusDays((heatmapDays - 1).toLong()))
            val heatmap = generateSequence(heatmapStart) { it.plusDays(1) }
                .takeWhile { !it.isAfter(today) }
                .map { d ->
                    HeatmapDay(
                        date = d,
                        scheduled = isEffectivelyScheduled(habit, d, completionsByDate),
                        status = completionsByDate[d],
                    )
                }
                .toList()

            HabitDetail(
                habit = habit,
                currentStreak = streak.current,
                bestStreak = streak.best,
                completionRatePercent = completionRate,
                heatmap = heatmap,
            )
        }

    override fun observeMonthAggregate(month: YearMonth): Flow<List<DayAggregate>> =
        observeAggregatesForDates((1..month.lengthOfMonth()).map { month.atDay(it) })

    override fun observeAggregatesForDates(dates: List<LocalDate>): Flow<List<DayAggregate>> =
        combine(habitDao.observeActive(), completionDao.observeAll()) { entities, completions ->
            val completionsByHabit = completions.groupBy { it.habitId }
            val habits = entities.map { entity ->
                entity.id to (entity.toDomain() to completionsByHabit[entity.id].orEmpty().associate { it.date to it.status })
            }
            dates.map { date ->
                var scheduledCount = 0
                var doneCount = 0
                var excusedCount = 0
                habits.forEach { (_, pair) ->
                    val (habit, completionsByDate) = pair
                    if (date.isBefore(habit.createdAt)) return@forEach
                    if (isEffectivelyScheduled(habit, date, completionsByDate)) {
                        scheduledCount++
                        when (completionsByDate[date]) {
                            HabitCompletionStatus.DONE -> doneCount++
                            HabitCompletionStatus.SKIPPED_EXCUSED -> excusedCount++
                            else -> Unit
                        }
                    }
                }
                DayAggregate(date, scheduledCount, doneCount, excusedCount)
            }
        }

    override fun observeInsights(period: InsightsPeriod): Flow<InsightsSummary> =
        combine(habitDao.observeActive(), completionDao.observeAll()) { entities, completions ->
            val completionsByHabit = completions.groupBy { it.habitId }
            val today = LocalDate.now()
            val periodStart = today.minusDays((period.days - 1).toLong())

            val insights = entities.map { entity ->
                val habit = entity.toDomain()
                val completionsByDate = completionsByHabit[entity.id].orEmpty().associate { it.date to it.status }
                var scheduled = 0
                var done = 0
                var excused = 0
                var date = maxOf(periodStart, habit.createdAt)
                while (!date.isAfter(today)) {
                    if (isEffectivelyScheduled(habit, date, completionsByDate)) {
                        scheduled++
                        when (completionsByDate[date]) {
                            HabitCompletionStatus.DONE -> done++
                            HabitCompletionStatus.SKIPPED_EXCUSED -> excused++
                            else -> Unit
                        }
                    }
                    date = date.plusDays(1)
                }
                HabitInsight(habit, scheduled, done, excused)
            }

            val totalScheduled = insights.sumOf { it.scheduledCount }
            val totalSatisfied = insights.sumOf { it.doneCount + it.excusedCount }
            val overallRate = if (totalScheduled == 0) 0 else (totalSatisfied * 100) / totalScheduled

            InsightsSummary(period, insights, overallRate)
        }

    override suspend fun exportAllCompletionsCsv(): String {
        val habitsById = habitDao.getAll().associateBy { it.id }
        val completions = completionDao.getAll()
        val builder = StringBuilder("habit_name,date,status,completed_at\n")
        completions.forEach { completion ->
            val name = habitsById[completion.habitId]?.name?.replace(",", " ") ?: "unknown"
            builder.append(name)
                .append(',')
                .append(completion.date)
                .append(',')
                .append(completion.status.name)
                .append(',')
                .append(completion.completedAt?.toString().orEmpty())
                .append('\n')
        }
        return builder.toString()
    }

    override fun observeActiveRoutines(): Flow<List<Routine>> =
        routineDao.observeActive().map { entities -> entities.map { it.toDomain() } }

    override suspend fun getRoutine(id: Long): Routine? = routineDao.getById(id)?.toDomain()

    override suspend fun addRoutine(routine: Routine): Long = routineDao.insert(routine.toEntity())

    override suspend fun updateRoutine(routine: Routine) = routineDao.update(routine.toEntity())

    override suspend fun archiveRoutine(id: Long) = routineDao.archive(id)
}
