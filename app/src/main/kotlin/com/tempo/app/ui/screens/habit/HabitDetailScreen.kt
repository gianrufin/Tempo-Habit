package com.tempo.app.ui.screens.habit

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.HabitDetail
import com.tempo.app.domain.model.HeatmapDay
import com.tempo.app.ui.components.GradientIconButton
import com.tempo.app.ui.components.GradientTopBar
import com.tempo.app.ui.theme.TempoExtraShapes
import com.tempo.app.ui.theme.TempoGradients
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun HabitDetailScreen(
    onBack: () -> Unit,
    onEdit: (Long) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HabitDetailViewModel = hiltViewModel(),
) {
    val detail by viewModel.detail.collectAsState()
    val bestTime by viewModel.bestTime.collectAsState()

    Scaffold(
        modifier = modifier,
        topBar = {
            GradientTopBar(
                title = detail?.habit?.name.orEmpty(),
                gradient = TempoGradients.detail,
                onBack = onBack,
                backIcon = Icons.Filled.ArrowBack,
                actions = {
                    GradientIconButton(
                        icon = Icons.Filled.Edit,
                        contentDescription = "Edit habit",
                        onClick = { onEdit(viewModel.habitId) },
                    )
                },
            )
        },
    ) { innerPadding ->
        val current = detail
        if (current == null) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding))
        } else {
            HabitDetailContent(detail = current, bestTime = bestTime, modifier = Modifier.padding(innerPadding))
        }
    }
}

@Composable
private fun HabitDetailContent(detail: HabitDetail, bestTime: LocalTime?, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatCard(label = "Current streak", value = detail.currentStreak.toString(), modifier = Modifier.weight(1f))
            StatCard(label = "Best streak", value = detail.bestStreak.toString(), modifier = Modifier.weight(1f))
            StatCard(label = "Last 30 days", value = "${detail.completionRatePercent}%", modifier = Modifier.weight(1f))
        }

        if (bestTime != null) {
            val formatter = remember { DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT) }
            Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Best time to do it", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "You usually complete this around ${bestTime.format(formatter)}.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = "History", style = MaterialTheme.typography.titleMedium)
            Heatmap(heatmap = detail.heatmap)
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = TempoExtraShapes.card,
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            if (label == "Current streak") {
                Icon(
                    imageVector = Icons.Filled.LocalFireDepartment,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
            Text(text = value, style = MaterialTheme.typography.titleLarge)
            Text(text = label, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
private fun Heatmap(heatmap: List<HeatmapDay>) {
    if (heatmap.isEmpty()) {
        Text("No history yet.", style = MaterialTheme.typography.bodyMedium)
        return
    }
    val firstDate = heatmap.first().date
    val leadingPadding = firstDate.dayOfWeek.value - 1
    val padded: List<HeatmapDay?> = List(leadingPadding) { null } + heatmap
    val weeks = padded.chunked(7)

    LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        items(weeks) { week ->
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                week.forEach { day -> HeatmapCell(day) }
            }
        }
    }
}

@Composable
private fun HeatmapCell(day: HeatmapDay?) {
    val color = when {
        day == null -> Color.Transparent
        day.status == HabitCompletionStatus.DONE -> MaterialTheme.colorScheme.primary
        day.status == HabitCompletionStatus.SKIPPED_EXCUSED -> MaterialTheme.colorScheme.tertiaryContainer
        day.scheduled && day.date.isBefore(LocalDate.now()) -> MaterialTheme.colorScheme.errorContainer
        day.scheduled -> MaterialTheme.colorScheme.outlineVariant
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    Surface(
        modifier = Modifier.size(14.dp),
        shape = RoundedCornerShape(4.dp),
        color = color,
    ) {}
}
