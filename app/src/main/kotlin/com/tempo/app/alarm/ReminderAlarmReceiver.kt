package com.tempo.app.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.data.repository.TaskRepository
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.reminder.NotificationHelper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

/** Fired by an exact [android.app.AlarmManager] alarm; shows the reminder (if still due) and
 * reschedules the next occurrence for that same habit/task. */
@AndroidEntryPoint
class ReminderAlarmReceiver : BroadcastReceiver() {

    @Inject lateinit var habitRepository: HabitRepository
    @Inject lateinit var taskRepository: TaskRepository
    @Inject lateinit var notificationHelper: NotificationHelper
    @Inject lateinit var alarmRescheduler: AlarmRescheduler

    override fun onReceive(context: Context, intent: Intent) {
        AlarmDiagnostics.recordReceiverFired(context, intent.action)
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                when (intent.action) {
                    ACTION_HABIT_REMINDER -> handleHabitReminder(intent)
                    ACTION_TASK_REMINDER -> handleTaskReminder(intent)
                    ACTION_TEST_ALARM -> notificationHelper.showTestAlarmFiredNotification()
                }
            } finally {
                pendingResult.finish()
            }
        }
    }

    private suspend fun handleHabitReminder(intent: Intent) {
        val habitId = intent.getLongExtra(EXTRA_HABIT_ID, -1L)
        if (habitId == -1L) return

        val habit = habitRepository.getHabit(habitId)
        if (habit != null && !habit.archived) {
            val status = habitRepository.getCompletionStatus(habitId, LocalDate.now())
            if (status != HabitCompletionStatus.DONE && status != HabitCompletionStatus.SKIPPED_EXCUSED) {
                notificationHelper.showReminder(habit)
            }
        }
        alarmRescheduler.rescheduleHabit(habitId)
    }

    private suspend fun handleTaskReminder(intent: Intent) {
        val taskId = intent.getLongExtra(EXTRA_TASK_ID, -1L)
        if (taskId == -1L) return

        val task = taskRepository.getTask(taskId)
        if (task != null && !task.archived) {
            val done = taskRepository.isDoneForDate(taskId, LocalDate.now())
            if (!done) notificationHelper.showTaskReminder(task)
        }
        alarmRescheduler.rescheduleTask(taskId)
    }

    companion object {
        const val ACTION_HABIT_REMINDER = "com.tempo.app.action.HABIT_REMINDER"
        const val ACTION_TASK_REMINDER = "com.tempo.app.action.TASK_REMINDER"
        /** Fired by Settings > Notifications > "Test alarm in 10 seconds" — proves the whole
         * AlarmManager -> BroadcastReceiver -> notification pipeline works end to end, not just
         * that the app can post a notification while it's in the foreground. */
        const val ACTION_TEST_ALARM = "com.tempo.app.action.TEST_ALARM"
        const val EXTRA_HABIT_ID = "extra_habit_id"
        const val EXTRA_TASK_ID = "extra_task_id"
    }
}
