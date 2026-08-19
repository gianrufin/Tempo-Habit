package com.tempo.app.alarm

import android.content.Context
import android.content.Intent
import android.util.Log
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.data.repository.TaskRepository
import com.tempo.app.domain.AdaptiveReminderCalculator
import com.tempo.app.domain.RecurrenceEngine
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.Task
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import javax.inject.Inject

/**
 * Computes each habit/task reminder's next real occurrence (respecting its recurrence rule and
 * whether it's already done) and schedules exactly that one alarm — called after every add/edit/
 * delete, after each alarm fires (to queue up the following one), on app start, and after boot
 * (AlarmManager alarms don't survive a reboot).
 */
class AlarmRescheduler @Inject constructor(
    @ApplicationContext private val context: Context,
    private val habitRepository: HabitRepository,
    private val taskRepository: TaskRepository,
    private val scheduler: ExactAlarmScheduler,
) {
    private val lookaheadDays = 400

    /**
     * Every public entry point is best-effort: it runs inline with user actions (saving a habit/
     * task, starting a timer) and a failure here (bad data, a repository hiccup, anything) must
     * never surface as a crash of that action.
     */
    suspend fun rescheduleAll() {
        runCatching {
            habitRepository.getAllActiveHabits().forEach { habit ->
                cancelHabitSlots(habit.id)
                scheduleHabit(habit)
            }
            taskRepository.getAllActiveTasks().forEach { task ->
                cancelTaskAlarm(task.id)
                scheduleTask(task)
            }
        }.onFailure { Log.w(TAG, "rescheduleAll failed", it) }
    }

    suspend fun rescheduleHabit(habitId: Long) {
        runCatching {
            cancelHabitSlots(habitId)
            val habit = habitRepository.getHabit(habitId)
            if (habit != null && !habit.archived) scheduleHabit(habit)
        }.onFailure { Log.w(TAG, "rescheduleHabit($habitId) failed", it) }
    }

    suspend fun rescheduleTask(taskId: Long) {
        runCatching {
            cancelTaskAlarm(taskId)
            val task = taskRepository.getTask(taskId)
            if (task != null && !task.archived) scheduleTask(task)
        }.onFailure { Log.w(TAG, "rescheduleTask($taskId) failed", it) }
    }

    private suspend fun scheduleHabit(habit: Habit) {
        if (habit.reminderTimes.isEmpty()) return
        if (habit.pausedUntil != null && habit.pausedUntil.isAfter(LocalDate.now())) return
        val recentDone = habitRepository.getRecentDoneTimestamps(habit.id)

        habit.reminderTimes.forEachIndexed { slot, reminderTime ->
            val effectiveTime = AdaptiveReminderCalculator.suggestTime(recentDone, reminderTime)
            val date = findNextHabitOccurrence(habit, effectiveTime) ?: return@forEachIndexed
            val triggerMillis = date.atTime(effectiveTime).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()

            val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
                action = ReminderAlarmReceiver.ACTION_HABIT_REMINDER
                putExtra(ReminderAlarmReceiver.EXTRA_HABIT_ID, habit.id)
            }
            scheduler.scheduleAlarmClock(AlarmRequestCodes.habit(habit.id, slot), triggerMillis, intent)
        }
    }

    private suspend fun scheduleTask(task: Task) {
        val time = task.reminderTime ?: return
        val now = LocalDateTime.now()

        val triggerDate = if (task.isRecurring) {
            val rule = task.recurrenceRule ?: return
            findNextRecurringTaskOccurrence(task, rule, time)
        } else {
            val due = task.dueDate ?: return
            if (task.completedAt != null) return
            due.takeIf { it.atTime(time).isAfter(now) }
        } ?: return

        val triggerMillis = triggerDate.atTime(time).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
            action = ReminderAlarmReceiver.ACTION_TASK_REMINDER
            putExtra(ReminderAlarmReceiver.EXTRA_TASK_ID, task.id)
        }
        scheduler.scheduleAlarmClock(AlarmRequestCodes.task(task.id), triggerMillis, intent)
    }

    private suspend fun findNextHabitOccurrence(habit: Habit, time: LocalTime): LocalDate? {
        val now = LocalDateTime.now()
        var date = LocalDate.now()
        for (i in 0 until lookaheadDays) {
            val pausedOnDate = habit.pausedUntil != null && date.isBefore(habit.pausedUntil)
            if (!pausedOnDate && !date.isBefore(habit.createdAt) && RecurrenceEngine.isScheduledOn(habit.recurrenceRule, date)) {
                if (date.atTime(time).isAfter(now)) {
                    val status = habitRepository.getCompletionStatus(habit.id, date)
                    if (status != HabitCompletionStatus.DONE && status != HabitCompletionStatus.SKIPPED_EXCUSED) {
                        return date
                    }
                }
            }
            date = date.plusDays(1)
        }
        return null
    }

    private suspend fun findNextRecurringTaskOccurrence(
        task: Task,
        rule: RecurrenceRule,
        time: LocalTime,
    ): LocalDate? {
        val now = LocalDateTime.now()
        var date = LocalDate.now()
        for (i in 0 until lookaheadDays) {
            if (!date.isBefore(task.createdAt) && RecurrenceEngine.isScheduledOn(rule, date)) {
                if (date.atTime(time).isAfter(now) && !taskRepository.isDoneForDate(task.id, date)) {
                    return date
                }
            }
            date = date.plusDays(1)
        }
        return null
    }

    private fun cancelHabitSlots(habitId: Long) {
        val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
            action = ReminderAlarmReceiver.ACTION_HABIT_REMINDER
        }
        for (slot in 0 until AlarmRequestCodes.MAX_HABIT_REMINDER_SLOTS) {
            scheduler.cancel(AlarmRequestCodes.habit(habitId, slot), intent)
        }
    }

    private fun cancelTaskAlarm(taskId: Long) {
        val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
            action = ReminderAlarmReceiver.ACTION_TASK_REMINDER
        }
        scheduler.cancel(AlarmRequestCodes.task(taskId), intent)
    }

    private companion object {
        const val TAG = "AlarmRescheduler"
    }
}
