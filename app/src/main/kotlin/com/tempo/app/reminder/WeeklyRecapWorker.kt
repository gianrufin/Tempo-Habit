package com.tempo.app.reminder

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.domain.model.InsightsPeriod
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first

/** Runs weekly (Sunday evening) with a one-line completion-rate summary of the past 7 days. */
@HiltWorker
class WeeklyRecapWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: HabitRepository,
    private val notificationHelper: NotificationHelper,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val summary = repository.observeInsights(InsightsPeriod.WEEK).first()
        if (summary.habitInsights.isNotEmpty()) {
            notificationHelper.showWeeklyRecap(summary.overallRatePercent, summary.period.label.lowercase())
        }
        return Result.success()
    }
}
