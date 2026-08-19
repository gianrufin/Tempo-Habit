package com.tempo.app.ui.screens.habit

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.TimeOfDay
import com.tempo.app.ui.theme.TempoExtraShapes
import java.time.DayOfWeek
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditHabitScreen(
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AddEditHabitViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.isSaved) {
        if (state.isSaved) onDone()
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text(if (state.habitId == null) "New habit" else "Edit habit") },
                navigationIcon = {
                    IconButton(onClick = onDone) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (state.habitId != null) {
                        IconButton(onClick = viewModel::delete) {
                            Icon(Icons.Filled.Delete, contentDescription = "Delete habit")
                        }
                    }
                },
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            OutlinedTextField(
                value = state.name,
                onValueChange = viewModel::onNameChange,
                label = { Text("Habit name") },
                shape = TempoExtraShapes.card,
                modifier = Modifier.fillMaxWidth(),
            )

            Section(title = "Icon") {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(AddEditHabitUiState.DEFAULT_ICONS) { icon ->
                        FilterChip(
                            selected = state.icon == icon,
                            onClick = { viewModel.onIconChange(icon) },
                            label = { Text(icon) },
                            shape = TempoExtraShapes.pill,
                        )
                    }
                }
            }

            Section(title = "Color") {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AddEditHabitUiState.DEFAULT_COLORS.forEach { colorLong ->
                        val selected = state.colorArgb == colorLong
                        Surface(
                            modifier = Modifier
                                .size(36.dp)
                                .clickable { viewModel.onColorChange(colorLong) },
                            shape = CircleShape,
                            color = Color(colorLong),
                            border = if (selected) {
                                BorderStroke(3.dp, MaterialTheme.colorScheme.onSurface)
                            } else null,
                        ) {}
                    }
                }
            }

            Section(title = "Repeats") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        RecurrenceType.entries.forEach { type ->
                            FilterChip(
                                selected = state.recurrenceType == type,
                                onClick = { viewModel.onRecurrenceTypeChange(type) },
                                label = { Text(type.label()) },
                                shape = TempoExtraShapes.pill,
                            )
                        }
                    }

                    when (state.recurrenceType) {
                        RecurrenceType.SPECIFIC_WEEKDAYS -> WeekdayPicker(
                            selected = state.selectedWeekdays,
                            onToggle = viewModel::onToggleWeekday,
                        )
                        RecurrenceType.EVERY_N_DAYS -> Stepper(
                            label = "Every ${state.everyNDays} day(s)",
                            value = state.everyNDays,
                            onValueChange = viewModel::onEveryNDaysChange,
                        )
                        RecurrenceType.TIMES_PER_WEEK -> Stepper(
                            label = "${state.timesPerWeek} time(s) a week",
                            value = state.timesPerWeek,
                            onValueChange = viewModel::onTimesPerWeekChange,
                        )
                        RecurrenceType.MONTHLY_BY_DATE -> Stepper(
                            label = "Day ${state.monthlyDayOfMonth} of the month",
                            value = state.monthlyDayOfMonth,
                            onValueChange = viewModel::onMonthlyDayChange,
                        )
                        RecurrenceType.DAILY -> Text(
                            "Every day",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                }
            }

            Section(title = "Streak freezes per week") {
                Stepper(
                    label = "${state.streakFreezeAllowance} freeze(s)",
                    value = state.streakFreezeAllowance,
                    onValueChange = viewModel::onStreakFreezeAllowanceChange,
                )
            }

            Section(title = "Grace period for overdue") {
                Stepper(
                    label = "${state.graceDays} day(s)",
                    value = state.graceDays,
                    onValueChange = viewModel::onGraceDaysChange,
                )
            }

            Section(title = "Time of day") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TimeOfDay.entries.forEach { tod ->
                        FilterChip(
                            selected = state.timeOfDay == tod,
                            onClick = { viewModel.onTimeOfDayChange(tod) },
                            label = { Text(tod.label) },
                            shape = TempoExtraShapes.pill,
                        )
                    }
                }
            }

            Section(title = "Reminders") {
                RemindersRow(
                    times = state.reminderTimes,
                    onAdd = viewModel::onAddReminderTime,
                    onRemove = viewModel::onRemoveReminderTime,
                )
            }

            if (state.habitId != null) {
                Section(title = "Vacation mode") {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        val pausedUntil = state.pausedUntil
                        if (pausedUntil != null && pausedUntil.isAfter(java.time.LocalDate.now())) {
                            Text(
                                "Paused until $pausedUntil — no reminders or missed-streak penalties until then.",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            OutlinedButton(onClick = viewModel::onResumeFromPause, shape = TempoExtraShapes.pill) {
                                Text("Resume now")
                            }
                        } else {
                            Text(
                                "Going away? Pause this habit so it won't count against your streak.",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(onClick = { viewModel.onPauseFor(3) }, shape = TempoExtraShapes.pill) {
                                    Text("3 days")
                                }
                                OutlinedButton(onClick = { viewModel.onPauseFor(7) }, shape = TempoExtraShapes.pill) {
                                    Text("1 week")
                                }
                                OutlinedButton(onClick = { viewModel.onPauseFor(14) }, shape = TempoExtraShapes.pill) {
                                    Text("2 weeks")
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = viewModel::save,
                enabled = state.isValid,
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Save habit")
            }
        }
    }
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(text = title, style = MaterialTheme.typography.titleMedium)
        content()
    }
}

@Composable
private fun WeekdayPicker(selected: Set<DayOfWeek>, onToggle: (DayOfWeek) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        DayOfWeek.entries.forEach { day ->
            val label = day.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(2)
            FilterChip(
                selected = day in selected,
                onClick = { onToggle(day) },
                label = { Text(label) },
                shape = TempoExtraShapes.pill,
            )
        }
    }
}

@Composable
private fun Stepper(label: String, value: Int, onValueChange: (Int) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedButton(onClick = { onValueChange(value - 1) }, shape = TempoExtraShapes.pill) {
            Icon(Icons.Filled.Remove, contentDescription = "Decrease")
        }
        Text(text = label, style = MaterialTheme.typography.bodyLarge)
        OutlinedButton(onClick = { onValueChange(value + 1) }, shape = TempoExtraShapes.pill) {
            Icon(Icons.Filled.Add, contentDescription = "Increase")
        }
    }
}

@Composable
private fun RemindersRow(
    times: List<LocalTime>,
    onAdd: (LocalTime) -> Unit,
    onRemove: (LocalTime) -> Unit,
) {
    var showPicker by remember { mutableStateOf(false) }
    val formatter = remember { DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT) }

    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        times.forEach { time ->
            FilterChip(
                selected = true,
                onClick = { onRemove(time) },
                label = { Text(time.format(formatter)) },
                trailingIcon = {
                    Icon(Icons.Filled.Close, contentDescription = "Remove reminder", modifier = Modifier.size(16.dp))
                },
                shape = TempoExtraShapes.pill,
            )
        }
        OutlinedButton(onClick = { showPicker = true }, shape = TempoExtraShapes.pill) {
            Icon(Icons.Filled.Add, contentDescription = "Add reminder")
        }
    }

    if (showPicker) {
        TimePickerDialog(
            onDismiss = { showPicker = false },
            onConfirm = { time ->
                onAdd(time)
                showPicker = false
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TimePickerDialog(onDismiss: () -> Unit, onConfirm: (LocalTime) -> Unit) {
    val now = remember { LocalTime.now() }
    val state = rememberTimePickerState(initialHour = now.hour, initialMinute = now.minute, is24Hour = false)

    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surface) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                TimePicker(state = state)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Button(
                        onClick = { onConfirm(LocalTime.of(state.hour, state.minute)) },
                        shape = TempoExtraShapes.pill,
                    ) { Text("Add") }
                }
            }
        }
    }
}

private fun RecurrenceType.label(): String = when (this) {
    RecurrenceType.DAILY -> "Daily"
    RecurrenceType.SPECIFIC_WEEKDAYS -> "Weekdays"
    RecurrenceType.EVERY_N_DAYS -> "Every N days"
    RecurrenceType.TIMES_PER_WEEK -> "X / week"
    RecurrenceType.MONTHLY_BY_DATE -> "Monthly"
}
