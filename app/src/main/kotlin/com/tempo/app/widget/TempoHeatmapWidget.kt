package com.tempo.app.widget

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.color.ColorProvider
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.tempo.app.MainActivity
import com.tempo.app.di.WidgetEntryPoint
import com.tempo.app.domain.model.DayAggregate
import dagger.hilt.android.EntryPointAccessors
import kotlinx.coroutines.flow.first
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale

// Same day/night pairing convention as TempoWidget's palette (see its comment) — the widget can't
// read MaterialTheme, so these are hand-picked to echo the app's purple brand at rising intensity.
private val WidgetBackground = ColorProvider(day = Color(0xFFFFFBFE), night = Color(0xFF1C1B1F))
private val WidgetOnBackground = ColorProvider(day = Color(0xFF1C1B1F), night = Color(0xFFE6E1E5))
private val CellNoData = ColorProvider(day = Color(0xFFF1EDF5), night = Color(0xFF2A2536))
private val CellMissed = ColorProvider(day = Color(0xFFE7E0EC), night = Color(0xFF3A3546))
private val CellLow = ColorProvider(day = Color(0xFFD8C7F0), night = Color(0xFF4A3A70))
private val CellMedium = ColorProvider(day = Color(0xFFB79CE0), night = Color(0xFF6A4FA0))
private val CellFull = ColorProvider(day = Color(0xFF6750A4), night = Color(0xFFD0BCFF))
private val CellTransparent = ColorProvider(day = Color.Transparent, night = Color.Transparent)

/**
 * A GitHub-style month heatmap of overall habit completion, one cell per day — a companion to
 * [TempoWidget]'s tap-to-complete checklist rather than a replacement: this one is read-only and
 * about seeing the month's shape at a glance, not acting on any single habit.
 */
class TempoHeatmapWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repository = EntryPointAccessors.fromApplication(
            context.applicationContext,
            WidgetEntryPoint::class.java,
        ).habitRepository()

        val month = YearMonth.now()
        val aggregates = repository.observeMonthAggregate(month).first()

        provideContent {
            TempoHeatmapContent(month, aggregates)
        }
    }
}

@Composable
private fun TempoHeatmapContent(month: YearMonth, aggregates: List<DayAggregate>) {
    val byDate = aggregates.associateBy { it.date }
    val firstOfMonth = month.atDay(1)
    val leadingPadding = firstOfMonth.dayOfWeek.value - 1
    val days: List<LocalDate?> = List(leadingPadding) { null } + (1..month.lengthOfMonth()).map { month.atDay(it) }
    val weeks = days.chunked(7)
    val monthLabel = firstOfMonth.format(DateTimeFormatter.ofPattern("MMMM", Locale.getDefault()))
    val context = LocalContext.current

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(WidgetBackground)
            .clickable(actionStartActivity(Intent(context, MainActivity::class.java)))
            .padding(12.dp),
    ) {
        Text(
            text = monthLabel,
            style = TextStyle(fontWeight = FontWeight.Bold, color = WidgetOnBackground),
        )
        Spacer(modifier = GlanceModifier.height(8.dp))
        weeks.forEach { week ->
            Row(modifier = GlanceModifier.fillMaxWidth()) {
                week.forEachIndexed { index, date ->
                    HeatmapCell(byDate[date])
                    if (index != week.lastIndex) Spacer(modifier = GlanceModifier.width(4.dp))
                }
            }
            Spacer(modifier = GlanceModifier.height(4.dp))
        }
    }
}

@Composable
private fun HeatmapCell(aggregate: DayAggregate?) {
    val color = when {
        aggregate == null -> CellTransparent
        aggregate.scheduledCount == 0 -> CellNoData
        aggregate.completionFraction <= 0f -> CellMissed
        aggregate.completionFraction < 0.5f -> CellLow
        aggregate.completionFraction < 1f -> CellMedium
        else -> CellFull
    }
    Box(
        modifier = GlanceModifier
            .size(24.dp)
            .background(color)
            .cornerRadius(6.dp),
    ) {}
}
