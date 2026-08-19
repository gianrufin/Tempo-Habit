package com.tempo.app.reminder

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.tempo.app.data.local.dao.HabitCompletionDao
import com.tempo.app.data.local.dao.HabitDao
import com.tempo.app.data.repository.toDomain
import com.tempo.app.domain.RecurrenceEngine
import com.tempo.app.domain.StreakCalculator
import com.tempo.app.domain.model.HabitCompletionStatus
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.time.LocalDate

/**
 * Runs once daily in the evening: for every active habit that's scheduled today, not yet
 * done/excused, and currently on a streak of 2+ days, nudges the user that the streak lapses if
 * they don't act before midnight.
 */
@HiltWorker
class StreakRiskWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val habitDao: HabitDao,
    private val completionDao: HabitCompletionDao,
    private val notificationHelper: NotificationHelper,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val today = LocalDate.now()

        habitDao.getAllActive().forEach { entity ->
            val habit = entity.toDomain()
            if (today.isBefore(habit.createdAt)) return@forEach

            val todaysCompletion = completionDao.getForHabitAndDate(habit.id, today)
            if (todaysCompletion?.status == HabitCompletionStatus.DONE ||
                todaysCompletion?.status == HabitCompletionStatus.SKIPPED_EXCUSED
            ) {
                return@forEach
            }
            if (!RecurrenceEngine.isScheduledOn(habit.recurrenceRule, today)) return@forEach

            val completions = completionDao.getAllForHabit(habit.id).associate { it.date to it.status }
            val streak = StreakCalculator.calculate(habit.recurrenceRule, habit.createdAt, completions, today)
            if (streak.current >= 2) {
                notificationHelper.showStreakRisk(habit, streak.current)
            }
        }
        return Result.success()
    }
}
