package com.tempo.app.ui.screens.calendar

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.DayAggregate
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.HabitWithTodayStatus
import com.tempo.app.ui.theme.TempoExtraShapes
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun CalendarScreen(modifier: Modifier = Modifier, viewModel: CalendarViewModel = hiltViewModel()) {
    val month by viewModel.month.collectAsState()
    val aggregate by viewModel.monthAggregate.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val selectedDayHabits by viewModel.selectedDayHabits.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 16.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        MonthHeader(month = month, onPrevious = viewModel::onPreviousMonth, onNext = viewModel::onNextMonth)
        MonthGrid(
            month = month,
            aggregate = aggregate,
            selectedDate = selectedDate,
            onSelectDate = viewModel::onSelectDate,
        )
        SelectedDaySection(date = selectedDate, habits = selectedDayHabits)
    }
}

@Composable
private fun MonthHeader(month: YearMonth, onPrevious: () -> Unit, onNext: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onPrevious) {
            Icon(Icons.Filled.ChevronLeft, contentDescription = "Previous month")
        }
        Text(
            text = "${month.month.getDisplayName(TextStyle.FULL, Locale.getDefault())} ${month.year}",
            style = MaterialTheme.typography.titleLarge,
        )
        IconButton(onClick = onNext) {
            Icon(Icons.Filled.ChevronRight, contentDescription = "Next month")
        }
    }
}

@Composable
private fun MonthGrid(
    month: YearMonth,
    aggregate: List<DayAggregate>,
    selectedDate: LocalDate,
    onSelectDate: (LocalDate) -> Unit,
) {
    val leadingBlanks = month.atDay(1).dayOfWeek.value - 1
    val aggregateByDate = aggregate.associateBy { it.date }
    val cells: List<LocalDate?> = List(leadingBlanks) { null } + (1..month.lengthOfMonth()).map { month.atDay(it) }
    val weeks = cells.chunked(7)

    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            for (dayIndex in 1..7) {
                val label = DayOfWeek.of(dayIndex).getDisplayName(TextStyle.NARROW, Locale.getDefault())
                Text(
                    text = label,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
        weeks.forEach { week ->
            Row(modifier = Modifier.fillMaxWidth()) {
                week.forEach { date ->
                    Box(modifier = Modifier.weight(1f)) {
                        if (date == null) {
                            Box(modifier = Modifier.aspectRatio(1f))
                        } else {
                            DayCell(
                                date = date,
                                dayAggregate = aggregateByDate[date],
                                isSelected = date == selectedDate,
                                onClick = { onSelectDate(date) },
                            )
                        }
                    }
                }
                repeat(7 - week.size) {
                    Box(modifier = Modifier.weight(1f)) {
                        Box(modifier = Modifier.aspectRatio(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(
    date: LocalDate,
    dayAggregate: DayAggregate?,
    isSelected: Boolean,
    onClick: () -> Unit,
) {
    val isToday = date == LocalDate.now()
    val completion = dayAggregate?.completionFraction ?: 0f
    val baseColor = when {
        dayAggregate == null || dayAggregate.scheduledCount == 0 -> MaterialTheme.colorScheme.surface
        dayAggregate.isFullyComplete -> MaterialTheme.colorScheme.primary
        completion > 0f -> MaterialTheme.colorScheme.primaryContainer
        date.isBefore(LocalDate.now()) -> MaterialTheme.colorScheme.errorContainer
        else -> MaterialTheme.colorScheme.surfaceVariant
    }

    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .padding(3.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            modifier = Modifier
                .aspectRatio(1f)
                .clickable(onClick = onClick),
            shape = TempoExtraShapes.pill,
            color = baseColor,
            border = when {
                isSelected -> BorderStroke(2.dp, MaterialTheme.colorScheme.onSurface)
                isToday -> BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
                else -> null
            },
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxWidth()) {
                Text(text = date.dayOfMonth.toString(), style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

@Composable
private fun SelectedDaySection(date: LocalDate, habits: List<HabitWithTodayStatus>) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = date.month.getDisplayName(TextStyle.FULL, Locale.getDefault()) + " ${date.dayOfMonth}",
            style = MaterialTheme.typography.titleMedium,
        )
        if (habits.isEmpty()) {
            Text("Nothing scheduled.", style = MaterialTheme.typography.bodyMedium)
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                habits.forEach { item ->
                    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("${item.habit.icon}  ${item.habit.name}")
                            Text(text = item.status.label())
                        }
                    }
                }
            }
        }
    }
}

private fun HabitCompletionStatus?.label(): String = when (this) {
    HabitCompletionStatus.DONE -> "Done"
    HabitCompletionStatus.SKIPPED_EXCUSED -> "Frozen"
    HabitCompletionStatus.MISSED -> "Missed"
    null -> "Pending"
}
