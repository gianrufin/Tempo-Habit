package com.tempo.app.ui.screens.today

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.ui.window.Dialog
import com.tempo.app.domain.model.HabitTemplate
import com.tempo.app.domain.model.QUICK_ADD_TEMPLATES
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.HabitCompletionStatus
import com.tempo.app.domain.model.HabitWithTodayStatus
import com.tempo.app.domain.model.Mood
import com.tempo.app.domain.model.RoutineWithHabits
import com.tempo.app.ui.theme.OnGradient
import com.tempo.app.ui.theme.TempoExtraShapes
import com.tempo.app.ui.theme.TempoGradients
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodayScreen(
    modifier: Modifier = Modifier,
    onAddHabit: () -> Unit = {},
    onAddRoutine: () -> Unit = {},
    onOpenHabit: (Long) -> Unit = {},
    onOpenRoutine: (Long) -> Unit = {},
    onOpenSettings: () -> Unit = {},
    onOpenSearch: () -> Unit = {},
    viewModel: TodayViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    var showAddMenu by remember { mutableStateOf(false) }
    var showQuickAdd by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(TempoGradients.home),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding(),
        ) {
            GreetingHeader(
                name = state.greetingName,
                selectedDate = state.selectedDate,
                onOpenSettings = onOpenSettings,
                onOpenSearch = onOpenSearch,
            )
            DayStrip(
                entries = state.dayStrip,
                selectedDate = state.selectedDate,
                onSelectDate = viewModel::onSelectDate,
            )
            MoodCheckIn(
                currentMood = state.moodForSelectedDate?.mood,
                onSelectMood = viewModel::onSetMood,
            )

            if (state.isEmpty) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "Nothing planned for this day.",
                        color = OnGradient.textSecondary,
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(20.dp, 8.dp, 20.dp, 140.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    itemsIndexed(state.routineGroups, key = { _, item -> "routine-${item.routine.id}" }) { index, group ->
                        StackedItem(index = index, listState = listState) {
                            RoutineCard(
                                group = group,
                                onToggle = viewModel::onToggleHabit,
                                onSkip = viewModel::onSkipHabit,
                                onOpenRoutine = onOpenRoutine,
                            )
                        }
                    }
                    if (state.standaloneHabits.isNotEmpty()) {
                        val headerIndex = state.routineGroups.size
                        item(key = "standalone-header") {
                            StackedItem(index = headerIndex, listState = listState) {
                                Text(
                                    text = "Habits",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = OnGradient.textPrimary,
                                )
                            }
                        }
                        itemsIndexed(state.standaloneHabits, key = { _, item -> "habit-${item.habit.id}" }) { offset, item ->
                            StackedItem(index = headerIndex + 1 + offset, listState = listState) {
                                HabitRow(
                                    item = item,
                                    onToggle = { viewModel.onToggleHabit(item.habit.id) },
                                    onSkip = { viewModel.onSkipHabit(item.habit.id) },
                                    onClick = { onOpenHabit(item.habit.id) },
                                )
                            }
                        }
                    }
                }
            }
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .navigationBarsPadding()
                .padding(end = 20.dp, bottom = 88.dp),
        ) {
            Surface(
                shape = CircleShape,
                color = OnGradient.surfaceStrong,
                modifier = Modifier
                    .size(56.dp),
                onClick = { showAddMenu = true },
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(Icons.Filled.Add, contentDescription = "Add", tint = OnGradient.textPrimary)
                }
            }
            DropdownMenu(expanded = showAddMenu, onDismissRequest = { showAddMenu = false }) {
                DropdownMenuItem(text = { Text("New habit") }, onClick = { showAddMenu = false; onAddHabit() })
                DropdownMenuItem(text = { Text("New routine") }, onClick = { showAddMenu = false; onAddRoutine() })
                DropdownMenuItem(text = { Text("Quick add") }, onClick = { showAddMenu = false; showQuickAdd = true })
            }
        }

        if (showQuickAdd) {
            QuickAddDialog(
                onDismiss = { showQuickAdd = false },
                onSelect = { template ->
                    viewModel.onQuickAddHabit(template)
                    showQuickAdd = false
                },
            )
        }
    }
}

@Composable
private fun QuickAddDialog(onDismiss: () -> Unit, onSelect: (HabitTemplate) -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surface) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Quick add a habit", style = MaterialTheme.typography.titleMedium)
                Text(
                    "One tap, daily by default — edit it later if you'd like.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.height(8.dp))
                QUICK_ADD_TEMPLATES.forEach { template ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelect(template) }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(template.icon, style = MaterialTheme.typography.titleLarge)
                        Text(template.name, style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
        }
    }
}

@Composable
private fun GreetingHeader(
    name: String,
    selectedDate: LocalDate,
    onOpenSettings: () -> Unit,
    onOpenSearch: () -> Unit,
) {
    val dateLabel = remember(selectedDate) {
        selectedDate.format(DateTimeFormatter.ofPattern("MMMM d", Locale.getDefault()))
    }
    val greeting = if (name.isBlank()) "Hello there" else "Hello, $name"
    val dayWord = if (selectedDate == LocalDate.now()) "Today" else selectedDate.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.getDefault())

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 20.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top,
    ) {
        Column {
            Text(text = greeting, style = MaterialTheme.typography.bodyLarge, color = OnGradient.textSecondary)
            Text(
                text = "$dayWord\n$dateLabel",
                style = MaterialTheme.typography.headlineMedium,
                color = OnGradient.textPrimary,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = CircleShape, color = OnGradient.surface, modifier = Modifier.size(48.dp), onClick = onOpenSearch) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(Icons.Filled.Search, contentDescription = "Search", tint = OnGradient.textPrimary)
                }
            }
            Surface(shape = CircleShape, color = OnGradient.surface, modifier = Modifier.size(48.dp), onClick = onOpenSettings) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Icon(Icons.Filled.Settings, contentDescription = "Settings", tint = OnGradient.textPrimary)
                }
            }
            Surface(shape = CircleShape, color = OnGradient.surfaceStrong, modifier = Modifier.size(48.dp)) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(
                        text = name.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "T",
                        style = MaterialTheme.typography.titleMedium,
                        color = OnGradient.textPrimary,
                    )
                }
            }
        }
    }
}

/**
 * Wraps a Today list item so that as it scrolls up past the top of the viewport, it shrinks,
 * fades, and lags slightly behind the scroll offset — producing a "stacked cards peeking behind
 * each other" look instead of items simply disappearing off-screen.
 */
@Composable
private fun StackedItem(index: Int, listState: LazyListState, content: @Composable () -> Unit) {
    Box(
        modifier = Modifier.graphicsLayer {
            val itemInfo = listState.layoutInfo.visibleItemsInfo.firstOrNull { it.index == index }
            if (itemInfo != null && itemInfo.offset < 0) {
                val overshoot = -itemInfo.offset.toFloat()
                val depth = (overshoot / 60f).coerceIn(0f, 3f)
                translationY = overshoot - (depth * 10f)
                scaleX = 1f - depth * 0.04f
                scaleY = 1f - depth * 0.04f
                alpha = 1f - depth * 0.15f
            }
        },
    ) { content() }
}

/** A one-tap mood check-in row for the selected day; picking a mood immediately saves it. */
@Composable
private fun MoodCheckIn(currentMood: Mood?, onSelectMood: (Mood) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Mood.entries.forEach { mood ->
            val selected = mood == currentMood
            Surface(
                shape = CircleShape,
                color = if (selected) OnGradient.surfaceStrong else OnGradient.surface,
                modifier = Modifier.size(40.dp),
                onClick = { onSelectMood(mood) },
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    Text(mood.emoji, style = MaterialTheme.typography.titleMedium)
                }
            }
        }
    }
}

/** A horizontally scrollable date rail; each cell shows a slim progress bar reflecting that day's completion. */
@Composable
private fun DayStrip(
    entries: List<DayStripEntry>,
    selectedDate: LocalDate,
    onSelectDate: (LocalDate) -> Unit,
) {
    val listState = rememberLazyListState()
    val todayIndex = remember(entries) { entries.indexOfFirst { it.isToday }.coerceAtLeast(0) }

    LaunchedEffect(entries.size) {
        if (entries.isNotEmpty()) {
            listState.scrollToItem((todayIndex - 2).coerceAtLeast(0))
        }
    }

    LazyRow(
        state = listState,
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 20.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(entries, key = { it.date.toEpochDay() }) { entry ->
            DayCell(entry = entry, isSelected = entry.date == selectedDate, onClick = { onSelectDate(entry.date) })
        }
    }
}

@Composable
private fun DayCell(entry: DayStripEntry, isSelected: Boolean, onClick: () -> Unit) {
    val weekdayLabel = remember(entry.date) {
        entry.date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault())
    }
    val background = if (isSelected) OnGradient.textPrimary else OnGradient.surface
    val contentColor = if (isSelected) TempoAccentOnLight else OnGradient.textPrimary

    Surface(
        shape = TempoExtraShapes.card,
        color = background,
        onClick = onClick,
        modifier = Modifier.width(56.dp),
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(text = weekdayLabel, style = MaterialTheme.typography.labelSmall, color = contentColor.copy(alpha = 0.8f))
            Text(text = entry.date.dayOfMonth.toString(), style = MaterialTheme.typography.titleMedium, color = contentColor)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(3.dp)
                    .clip(TempoExtraShapes.pill)
                    .background(contentColor.copy(alpha = 0.25f)),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(entry.completionFraction.coerceIn(0f, 1f))
                        .height(3.dp)
                        .clip(TempoExtraShapes.pill)
                        .background(contentColor),
                )
            }
        }
    }
}

private val TempoAccentOnLight = androidx.compose.ui.graphics.Color(0xFF6B4CE0)

@Composable
private fun RoutineCard(
    group: RoutineWithHabits,
    onToggle: (Long) -> Unit,
    onSkip: (Long) -> Unit,
    onOpenRoutine: (Long) -> Unit,
) {
    Surface(
        shape = TempoExtraShapes.card,
        color = OnGradient.surface,
        modifier = Modifier
            .fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onOpenRoutine(group.routine.id) },
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = "${group.routine.icon} Your ${group.routine.name}",
                    style = MaterialTheme.typography.titleMedium,
                    color = OnGradient.textPrimary,
                )
            }
            group.habits.forEach { item ->
                HabitRow(
                    item = item,
                    onToggle = { onToggle(item.habit.id) },
                    onSkip = { onSkip(item.habit.id) },
                    onClick = { onToggle(item.habit.id) },
                    translucent = true,
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HabitRow(
    item: HabitWithTodayStatus,
    onToggle: () -> Unit,
    onSkip: () -> Unit,
    onClick: () -> Unit,
    translucent: Boolean = false,
) {
    val done = item.status == HabitCompletionStatus.DONE
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            when (value) {
                SwipeToDismissBoxValue.StartToEnd -> onToggle()
                SwipeToDismissBoxValue.EndToStart -> onSkip()
                SwipeToDismissBoxValue.Settled -> Unit
            }
            false
        },
    )
    val content: @Composable () -> Unit = {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(if (translucent) PaddingValues(vertical = 4.dp) else PaddingValues(16.dp)),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${item.habit.icon}  ${item.habit.name}",
                    style = MaterialTheme.typography.titleMedium,
                    color = OnGradient.textPrimary,
                    textDecoration = if (done) TextDecoration.LineThrough else null,
                )
                if (item.currentStreak > 0) {
                    Text(
                        text = "🔥 ${item.currentStreak} day streak",
                        style = MaterialTheme.typography.bodySmall,
                        color = OnGradient.textSecondary,
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            Surface(
                shape = TempoExtraShapes.pill,
                color = if (done) OnGradient.surfaceStrong else OnGradient.surface,
                onClick = onToggle,
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    if (done) {
                        Icon(
                            Icons.Filled.Check,
                            contentDescription = null,
                            tint = OnGradient.textPrimary,
                            modifier = Modifier.size(16.dp),
                        )
                    }
                    Text(
                        text = if (done) "Marked as done" else "Mark as done",
                        style = MaterialTheme.typography.labelMedium,
                        color = OnGradient.textPrimary,
                    )
                }
            }
        }
    }

    val rowContent: @Composable () -> Unit = if (translucent) {
        content
    } else {
        {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onClick),
                shape = TempoExtraShapes.card,
                color = OnGradient.surface,
            ) {
                content()
            }
        }
    }

    SwipeToDismissBox(
        state = dismissState,
        modifier = Modifier.fillMaxWidth(),
        backgroundContent = { SwipeBackground(dismissState.dismissDirection) },
    ) {
        rowContent()
    }
}

@Composable
private fun SwipeBackground(direction: SwipeToDismissBoxValue) {
    val (icon, alignment, color) = when (direction) {
        SwipeToDismissBoxValue.StartToEnd -> Triple(Icons.Filled.Check, Alignment.CenterStart, OnGradient.surfaceStrong)
        SwipeToDismissBoxValue.EndToStart -> Triple(Icons.Filled.Close, Alignment.CenterEnd, OnGradient.surface)
        SwipeToDismissBoxValue.Settled -> Triple(null, Alignment.Center, OnGradient.surface)
    }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(TempoExtraShapes.card)
            .background(color)
            .padding(horizontal = 20.dp),
        contentAlignment = alignment,
    ) {
        icon?.let { Icon(it, contentDescription = null, tint = OnGradient.textPrimary) }
    }
}
