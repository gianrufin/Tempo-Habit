package com.tempo.app.ui.screens.habit

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.domain.model.HabitDetail
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalTime
import java.time.ZoneId
import javax.inject.Inject

private const val BEST_TIME_MIN_SAMPLES = 3

@HiltViewModel
class HabitDetailViewModel @Inject constructor(
    private val repository: HabitRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    val habitId: Long = checkNotNull(savedStateHandle.get<Long>("habitId"))

    val detail: StateFlow<HabitDetail?> = repository.observeHabitDetail(habitId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    /** The time of day the user actually tends to complete this habit, once there's enough history to trust it. */
    private val _bestTime = MutableStateFlow<LocalTime?>(null)
    val bestTime = _bestTime.asStateFlow()

    init {
        viewModelScope.launch {
            val timestamps = repository.getRecentDoneTimestamps(habitId, limit = 20)
            if (timestamps.size >= BEST_TIME_MIN_SAMPLES) {
                val averageSecondOfDay = timestamps
                    .map { it.atZone(ZoneId.systemDefault()).toLocalTime().toSecondOfDay() }
                    .average()
                    .toInt()
                _bestTime.value = LocalTime.ofSecondOfDay(averageSecondOfDay.toLong())
            }
        }
    }
}
