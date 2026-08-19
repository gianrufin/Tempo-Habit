package com.tempo.app.ui.screens.insights

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.DayAggregate
import com.tempo.app.domain.model.HabitInsight
import com.tempo.app.domain.model.InsightsPeriod
import com.tempo.app.domain.model.InsightsSummary
import com.tempo.app.domain.model.Mood
import com.tempo.app.ui.components.shareCsv
import com.tempo.app.ui.components.shareProgressText
import com.tempo.app.ui.components.shareWeeklyRecapCard
import com.tempo.app.ui.theme.TempoExtraShapes
import kotlinx.coroutines.launch

@Composable
fun InsightsScreen(
    modifier: Modifier = Modifier,
    onOpenGoals: () -> Unit = {},
    viewModel: InsightsViewModel = hiltViewModel(),
) {
    val period by viewModel.period.collectAsState()
    val summary by viewModel.summary.collectAsState()
    val trend by viewModel.trend.collectAsState()
    val moodCorrelation by viewModel.moodCorrelation.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(16.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            InsightsPeriod.entries.forEach { p ->
                FilterChip(
                    selected = period == p,
                    onClick = { viewModel.onPeriodChange(p) },
                    label = { Text(p.label) },
                    shape = TempoExtraShapes.pill,
                )
            }
        }

        val currentSummary = summary
        if (currentSummary == null) {
            Text("No data yet.", style = MaterialTheme.typography.bodyMedium)
        } else {
            OverallCard(summary = currentSummary)

            if (trend.isNotEmpty()) {
                TrendChart(trend)
            }
            if (moodCorrelation.isNotEmpty()) {
                MoodCorrelationSection(moodCorrelation)
            }

            if (currentSummary.habitInsights.isEmpty()) {
                Text("Add a habit to see insights here.", style = MaterialTheme.typography.bodyMedium)
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(currentSummary.habitInsights, key = { it.habit.id }) { insight ->
                        HabitInsightRow(insight)
                    }
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            QuickAction(
                icon = Icons.Filled.Flag,
                label = "Goals",
                onClick = onOpenGoals,
                modifier = Modifier.weight(1f),
            )
            currentSummary?.let { summaryForShare ->
                QuickAction(
                    icon = Icons.Filled.Share,
                    label = "Share",
                    onClick = { shareProgressText(context, summaryForShare.toShareText()) },
                    modifier = Modifier.weight(1f),
                )
                QuickAction(
                    icon = Icons.Filled.Image,
                    label = "Recap card",
                    onClick = { shareWeeklyRecapCard(context, summaryForShare) },
                    modifier = Modifier.weight(1f),
                )
            }
            QuickAction(
                icon = Icons.Filled.FileDownload,
                label = "Export CSV",
                onClick = {
                    scope.launch {
                        val csv = viewModel.exportCsv()
                        shareCsv(context, csv)
                    }
                },
                modifier = Modifier.weight(1f),
            )
        }
    }
}

/** A compact icon-plus-label action, four of which fit in one row instead of stacking as
 * full-width buttons that used to take up roughly half the screen's height. */
@Composable
private fun QuickAction(icon: ImageVector, label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        onClick = onClick,
        shape = TempoExtraShapes.card,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Icon(icon, contentDescription = label, tint = MaterialTheme.colorScheme.primary)
            Text(label, style = MaterialTheme.typography.labelSmall, maxLines = 1)
        }
    }
}

private fun InsightsSummary.toShareText(): String {
    val topHabits = habitInsights
        .sortedByDescending { it.completionRatePercent }
        .take(3)
        .joinToString("\n") { "${it.habit.icon} ${it.habit.name}: ${it.completionRatePercent}%" }
    return buildString {
        append("My Tempo progress — ${period.label.lowercase()}\n")
        append("Overall completion: $overallRatePercent%\n")
        if (topHabits.isNotEmpty()) {
            append("\nTop habits:\n")
            append(topHabits)
        }
    }
}

@Composable
private fun OverallCard(summary: InsightsSummary) {
    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.primaryContainer) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = "${summary.overallRatePercent}%",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
            Text(
                text = "Overall completion, ${summary.period.label.lowercase()}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
            )
        }
    }
}

/** A simple 12-week bar sparkline of daily completion rate, grouped into weekly averages. */
@Composable
private fun TrendChart(trend: List<DayAggregate>) {
    val weeklyAverages = trend.chunked(7).map { week ->
        val fractions = week.filter { it.scheduledCount > 0 }.map { it.completionFraction }
        if (fractions.isEmpty()) 0f else fractions.average().toFloat()
    }

    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("12-week trend", style = MaterialTheme.typography.titleMedium)
            Row(
                modifier = Modifier.fillMaxWidth().height(60.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.Bottom,
            ) {
                weeklyAverages.forEach { fraction ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight(fraction.coerceIn(0.05f, 1f))
                            .clip(TempoExtraShapes.pill)
                            .background(MaterialTheme.colorScheme.primary),
                    )
                }
            }
        }
    }
}

@Composable
private fun MoodCorrelationSection(moodCorrelation: Map<Mood, Int>) {
    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Completion by mood", style = MaterialTheme.typography.titleMedium)
            Mood.entries.forEach { mood ->
                val rate = moodCorrelation[mood]
                if (rate != null) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("${mood.emoji}", style = MaterialTheme.typography.bodyLarge)
                        Text("$rate%", style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        }
    }
}

@Composable
private fun HabitInsightRow(insight: HabitInsight) {
    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(text = "${insight.habit.icon}  ${insight.habit.name}", style = MaterialTheme.typography.titleMedium)
                Text(text = "${insight.completionRatePercent}%", style = MaterialTheme.typography.titleMedium)
            }
            ProgressBar(fraction = insight.completionRatePercent / 100f)
            Text(
                text = "${insight.doneCount + insight.excusedCount} / ${insight.scheduledCount} completed",
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun ProgressBar(fraction: Float) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(10.dp)
            .clip(TempoExtraShapes.pill)
            .background(MaterialTheme.colorScheme.surface),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(fraction.coerceIn(0f, 1f))
                .height(10.dp)
                .clip(TempoExtraShapes.pill)
                .background(MaterialTheme.colorScheme.primary),
        )
    }
}
