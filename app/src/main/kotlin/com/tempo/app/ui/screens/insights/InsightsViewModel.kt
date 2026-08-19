package com.tempo.app.ui.screens.insights

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.data.repository.MoodRepository
import com.tempo.app.domain.model.DayAggregate
import com.tempo.app.domain.model.InsightsPeriod
import com.tempo.app.domain.model.InsightsSummary
import com.tempo.app.domain.model.Mood
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import java.time.LocalDate
import javax.inject.Inject

private const val TREND_DAYS = 84

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class InsightsViewModel @Inject constructor(
    private val repository: HabitRepository,
    private val moodRepository: MoodRepository,
) : ViewModel() {

    private val _period = MutableStateFlow(InsightsPeriod.WEEK)
    val period: StateFlow<InsightsPeriod> = _period.asStateFlow()

    val summary: StateFlow<InsightsSummary?> = _period
        .flatMapLatest { repository.observeInsights(it) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    private val today = LocalDate.now()
    private val trendDates = (TREND_DAYS - 1 downTo 0).map { today.minusDays(it.toLong()) }
    private val trendStart = trendDates.first()

    /** Last 12 weeks of daily completion, for a simple trend sparkline. */
    val trend: StateFlow<List<DayAggregate>> = repository.observeAggregatesForDates(trendDates)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    /** Average completion rate on days logged with each mood, over the same trend window. */
    val moodCorrelation: StateFlow<Map<Mood, Int>> = combine(
        trend,
        moodRepository.observeInRange(trendStart, today),
    ) { aggregates, moodEntries ->
        val aggregateByDate = aggregates.associateBy { it.date }
        moodEntries.groupBy { it.mood }.mapValues { (_, entries) ->
            val rates = entries.mapNotNull { entry -> aggregateByDate[entry.date]?.completionFraction }
            if (rates.isEmpty()) 0 else (rates.average() * 100).toInt()
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyMap())

    fun onPeriodChange(period: InsightsPeriod) {
        _period.value = period
    }

    suspend fun exportCsv(): String = repository.exportAllCompletionsCsv()
}
