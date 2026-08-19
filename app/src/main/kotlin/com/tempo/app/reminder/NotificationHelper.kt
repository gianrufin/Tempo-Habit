package com.tempo.app.reminder

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.tempo.app.R
import com.tempo.app.alarm.TaskReminderActionReceiver
import com.tempo.app.data.preferences.PreferencesRepository
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.Task
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import javax.inject.Inject

class NotificationHelper @Inject constructor(
    @ApplicationContext private val context: Context,
    private val preferencesRepository: PreferencesRepository,
) {
    init {
        createTimerChannel()
    }

    private fun createTimerChannel() {
        val manager = context.getSystemService(NotificationManager::class.java)
        // No channel sound here on purpose — TimerAlarmActivity/AlarmSoundPlayer plays the
        // user-chosen alarm sound directly so Stop/Snooze can control it precisely.
        manager.createNotificationChannel(
            NotificationChannel(TIMER_CHANNEL_ID, "Timer alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Pomodoro and countdown timer alarms"
                setSound(null, null)
            },
        )
    }

    /**
     * A notification channel's sound is locked in at creation and can't be changed afterward —
     * Android silently ignores any later attempt to alter an existing channel's settings. So
     * letting the user pick a custom notification sound means keying the channel ID to that sound
     * choice and creating a fresh channel whenever they pick a new one, rather than trying to
     * mutate a single fixed "habit_reminders" channel.
     */
    private suspend fun reminderChannelId(): String {
        val prefs = preferencesRepository.userPreferences.first()
        val soundUri = prefs.notificationSoundUri
        val channelId = if (soundUri == null) CHANNEL_ID else "${CHANNEL_ID}_${soundUri.hashCode()}"

        val manager = context.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(channelId) == null) {
            manager.createNotificationChannel(
                NotificationChannel(channelId, "Habit & task reminders", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "Reminders to complete your habits and tasks"
                    if (soundUri != null) {
                        setSound(
                            Uri.parse(soundUri),
                            AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build(),
                        )
                    }
                },
            )
        }
        return channelId
    }

    suspend fun showReminder(habit: Habit) {
        val notificationId = habit.id.toInt()

        val markDoneIntent = actionIntent(ReminderActionReceiver.ACTION_MARK_DONE, habit.id, notificationId)
        val skipIntent = actionIntent(ReminderActionReceiver.ACTION_SKIP, habit.id, notificationId)

        val notification = NotificationCompat.Builder(context, reminderChannelId())
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("${habit.icon} ${habit.name}")
            .setContentText("Time for your habit")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .addAction(0, "Mark done", markDoneIntent)
            .addAction(0, "Skip today", skipIntent)
            .build()

        notifyIfPermitted(notificationId, notification)
    }

    suspend fun showTaskReminder(task: Task) {
        val notificationId = TASK_REMINDER_NOTIFICATION_ID_OFFSET + task.id.toInt()

        val markDoneIntent = taskActionIntent(TaskReminderActionReceiver.ACTION_MARK_TASK_DONE, task.id, notificationId)

        val notification = NotificationCompat.Builder(context, reminderChannelId())
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(task.title)
            .setContentText("Task reminder")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .addAction(0, "Mark done", markDoneIntent)
            .build()

        notifyIfPermitted(notificationId, notification)
    }

    suspend fun showStreakRisk(habit: Habit, currentStreak: Int) {
        val notificationId = STREAK_RISK_NOTIFICATION_ID_OFFSET + habit.id.toInt()
        val notification = NotificationCompat.Builder(context, reminderChannelId())
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("🔥 ${habit.icon} ${habit.name}'s streak is at risk")
            .setContentText("$currentStreak day streak — complete it before the day ends")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        notifyIfPermitted(notificationId, notification)
    }

    suspend fun showWeeklyRecap(overallRatePercent: Int, periodLabel: String) {
        val notification = NotificationCompat.Builder(context, reminderChannelId())
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Your week in Tempo")
            .setContentText("$overallRatePercent% overall completion, $periodLabel")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()
        notifyIfPermitted(WEEKLY_RECAP_NOTIFICATION_ID, notification)
    }

    /**
     * The heads-up/lock-screen fallback for a fired timer alarm: [fullScreenIntent] is what the
     * system launches directly over the lock screen (the branded [com.tempo.app.ui.alarm.TimerAlarmActivity]);
     * this notification is what shows if the system suppresses that (e.g. screen already on and
     * unlocked in another app), so Stop/Snooze must work from here too.
     */
    fun showTimerAlarm(
        notificationId: Int,
        title: String,
        text: String,
        fullScreenIntent: PendingIntent,
        stopIntent: PendingIntent,
        snoozeIntent: PendingIntent,
    ) {
        val notification = NotificationCompat.Builder(context, TIMER_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenIntent, true)
            .addAction(0, "Snooze 5 min", snoozeIntent)
            .addAction(0, "Stop", stopIntent)
            .build()
        notifyIfPermitted(notificationId, notification)
    }

    fun cancelTimerAlarm(notificationId: Int) {
        NotificationManagerCompat.from(context).cancel(notificationId)
    }

    /** Whether the system will actually display Tempo's notifications right now — covers both
     * the runtime POST_NOTIFICATIONS permission (API 33+) and the user disabling notifications
     * for the app entirely (any API level), unlike checking the permission alone. */
    fun areNotificationsEnabled(): Boolean = NotificationManagerCompat.from(context).areNotificationsEnabled()

    /** Settings > Notifications > "Send test notification now" — an immediate, no-alarm-involved
     * check that permission + channel + display all work. Returns whether it was actually posted. */
    suspend fun showTestNotificationNow(): Boolean {
        val notification = NotificationCompat.Builder(context, reminderChannelId())
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Test notification")
            .setContentText("If you can see this, Tempo's notifications are working.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        return notifyIfPermitted(TEST_NOTIFICATION_ID, notification)
    }

    /** What [com.tempo.app.alarm.ReminderAlarmReceiver.ACTION_TEST_ALARM] shows once the 10-second
     * test alarm actually fires — proves the full AlarmManager -> BroadcastReceiver pipeline. */
    suspend fun showTestAlarmFiredNotification() {
        val notification = NotificationCompat.Builder(context, reminderChannelId())
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Test alarm fired ✅")
            .setContentText("The scheduled alarm reached Tempo and posted this notification.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()
        notifyIfPermitted(TEST_ALARM_NOTIFICATION_ID, notification)
    }

    private fun notifyIfPermitted(notificationId: Int, notification: Notification): Boolean {
        val permitted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        if (permitted) {
            NotificationManagerCompat.from(context).notify(notificationId, notification)
        }
        return permitted
    }

    private fun actionIntent(action: String, habitId: Long, notificationId: Int): PendingIntent {
        val intent = Intent(context, ReminderActionReceiver::class.java).apply {
            this.action = action
            putExtra(ReminderActionReceiver.EXTRA_HABIT_ID, habitId)
            putExtra(ReminderActionReceiver.EXTRA_NOTIFICATION_ID, notificationId)
        }
        return PendingIntent.getBroadcast(
            context,
            "$action-$habitId".hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun taskActionIntent(action: String, taskId: Long, notificationId: Int): PendingIntent {
        val intent = Intent(context, TaskReminderActionReceiver::class.java).apply {
            this.action = action
            putExtra(TaskReminderActionReceiver.EXTRA_TASK_ID, taskId)
            putExtra(TaskReminderActionReceiver.EXTRA_NOTIFICATION_ID, notificationId)
        }
        return PendingIntent.getBroadcast(
            context,
            "$action-$taskId".hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    companion object {
        const val CHANNEL_ID = "habit_reminders"
        const val TIMER_CHANNEL_ID = "timer_alarms"
        private const val STREAK_RISK_NOTIFICATION_ID_OFFSET = 1_000_000
        private const val WEEKLY_RECAP_NOTIFICATION_ID = 2_000_000
        private const val TASK_REMINDER_NOTIFICATION_ID_OFFSET = 3_000_000
        private const val TEST_NOTIFICATION_ID = 5_000_000
        private const val TEST_ALARM_NOTIFICATION_ID = 5_000_001
    }
}
