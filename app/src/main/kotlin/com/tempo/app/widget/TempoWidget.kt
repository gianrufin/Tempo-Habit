package com.tempo.app.widget

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.action.actionParametersOf
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.color.ColorProvider
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.tempo.app.MainActivity
import com.tempo.app.di.WidgetEntryPoint
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.HabitWithTodayStatus
import dagger.hilt.android.EntryPointAccessors
import kotlinx.coroutines.flow.first
import java.time.LocalDate

// Day/night pairs mirroring the app's own TempoTheme light/dark palette (see ui/theme/Color.kt),
// since the widget can't read MaterialTheme/GlanceTheme directly.
private val WidgetBackground = ColorProvider(day = Color(0xFFFFFBFE), night = Color(0xFF1C1B1F))
private val WidgetOnBackground = ColorProvider(day = Color(0xFF1C1B1F), night = Color(0xFFE6E1E5))
private val WidgetDoneBackground = ColorProvider(day = Color(0xFFEADDFF), night = Color(0xFF4F378B))
private val WidgetOnDoneBackground = ColorProvider(day = Color(0xFF21005D), night = Color(0xFFEADDFF))
private val WidgetPendingBackground = ColorProvider(day = Color(0xFFE7E0EC), night = Color(0xFF49454F))
private val WidgetOnPendingBackground = ColorProvider(day = Color(0xFF49454F), night = Color(0xFFCAC4D0))

class TempoWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val repository = EntryPointAccessors.fromApplication(
            context.applicationContext,
            WidgetEntryPoint::class.java,
        ).habitRepository()

        val habits = repository.observeHabitsForDate(LocalDate.now()).first()

        provideContent {
            TempoWidgetContent(habits)
        }
    }
}

@Composable
private fun TempoWidgetContent(habits: List<HabitWithTodayStatus>) {
    val context = LocalContext.current
    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(WidgetBackground)
            .clickable(actionStartActivity(Intent(context, MainActivity::class.java)))
            .padding(12.dp),
    ) {
        Text(
            text = "Today",
            style = TextStyle(fontWeight = FontWeight.Bold, color = WidgetOnBackground),
        )
        Spacer(modifier = GlanceModifier.height(8.dp))
        if (habits.isEmpty()) {
            Text(
                text = "No habits today",
                style = TextStyle(color = WidgetOnBackground),
            )
        } else {
            habits.take(6).forEach { item ->
                HabitWidgetRow(item)
                Spacer(modifier = GlanceModifier.height(6.dp))
            }
        }
    }
}

@Composable
private fun HabitWidgetRow(item: HabitWithTodayStatus) {
    val done = item.status == HabitCompletionStatus.DONE
    val background = if (done) WidgetDoneBackground else WidgetPendingBackground
    val onBackground = if (done) WidgetOnDoneBackground else WidgetOnPendingBackground

    Row(
        modifier = GlanceModifier
            .fillMaxWidth()
            .background(background)
            .cornerRadius(20.dp)
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .clickable(actionRunCallback<ToggleHabitAction>(actionParametersOf(habitIdKey to item.habit.id))),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "${item.habit.icon} ${item.habit.name}",
            style = TextStyle(color = onBackground),
        )
        Spacer(modifier = GlanceModifier.width(8.dp))
        Text(
            text = if (done) "✓" else "○",
            style = TextStyle(color = onBackground, fontWeight = FontWeight.Bold),
        )
    }
}
