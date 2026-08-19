package com.tempo.app.ui.screens.tasks

import android.content.Intent
import android.provider.CalendarContract
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DatePicker
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDatePickerState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.TaskChecklistItem
import com.tempo.app.domain.model.TaskPriority
import com.tempo.app.ui.screens.habit.RecurrenceType
import com.tempo.app.ui.theme.TempoExtraShapes
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.time.format.TextStyle
import java.util.Locale

/**
 * The "New Task" screen, inspired by a reference mock but reworked: the recurring/one-off choice
 * is the first decision (it determines whether a due date or a frequency picker follows), and
 * priority is a plain three-way chip row rather than a gated "premium" control.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditTaskScreen(
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AddEditTaskViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.isSaved) {
        if (state.isSaved) onDone()
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text(if (state.taskId == null) "New task" else "Edit task") },
                navigationIcon = {
                    IconButton(onClick = onDone) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (state.taskId != null) {
                        IconButton(onClick = viewModel::delete) {
                            Icon(Icons.Filled.Delete, contentDescription = "Delete task")
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
                value = state.title,
                onValueChange = viewModel::onTitleChange,
                label = { Text("Task title") },
                shape = TempoExtraShapes.card,
                modifier = Modifier.fillMaxWidth(),
            )

            TaskSection(title = "Recurring") {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = if (state.isRecurring) "Repeats on a schedule" else "One-off, with a due date",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Switch(checked = state.isRecurring, onCheckedChange = viewModel::onIsRecurringChange)
                }
            }

            if (state.isRecurring) {
                TaskSection(title = "Frequency") {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            RecurrenceType.entries.forEach { type ->
                                FilterChip(
                                    selected = state.recurrenceType == type,
                                    onClick = { viewModel.onRecurrenceTypeChange(type) },
                                    label = { Text(type.taskLabel()) },
                                    shape = TempoExtraShapes.pill,
                                )
                            }
                        }
                        when (state.recurrenceType) {
                            RecurrenceType.SPECIFIC_WEEKDAYS -> WeekdayPicker(
                                selected = state.selectedWeekdays,
                                onToggle = viewModel::onToggleWeekday,
                            )
                            RecurrenceType.EVERY_N_DAYS -> TaskStepper(
                                label = "Every ${state.everyNDays} day(s)",
                                value = state.everyNDays,
                                onValueChange = viewModel::onEveryNDaysChange,
                            )
                            RecurrenceType.TIMES_PER_WEEK -> TaskStepper(
                                label = "${state.timesPerWeek} time(s) a week",
                                value = state.timesPerWeek,
                                onValueChange = viewModel::onTimesPerWeekChange,
                            )
                            RecurrenceType.MONTHLY_BY_DATE -> TaskStepper(
                                label = "Day ${state.monthlyDayOfMonth} of the month",
                                value = state.monthlyDayOfMonth,
                                onValueChange = viewModel::onMonthlyDayChange,
                            )
                            RecurrenceType.DAILY -> Text("Every day", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            } else {
                TaskSection(title = "Due date") {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        DuePicker(dueDate = state.dueDate, onDueDateChange = viewModel::onDueDateChange)
                        val context = LocalContext.current
                        OutlinedButton(
                            onClick = { addTaskToDeviceCalendar(context, state.title, state.notes, state.dueDate) },
                            shape = TempoExtraShapes.pill,
                        ) {
                            Icon(Icons.Filled.CalendarMonth, contentDescription = null)
                            Text("  Add to calendar")
                        }
                    }
                }
            }

            TaskSection(title = "Reminder") {
                ReminderPicker(time = state.reminderTime, onTimeChange = viewModel::onReminderTimeChange)
            }

            TaskSection(title = "Priority") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TaskPriority.entries.forEach { priority ->
                        FilterChip(
                            selected = state.priority == priority,
                            onClick = { viewModel.onPriorityChange(priority) },
                            label = { Text(priority.label) },
                            shape = TempoExtraShapes.pill,
                        )
                    }
                }
            }

            TaskSection(title = "Checklist") {
                ChecklistEditor(
                    items = state.checklist,
                    onAdd = viewModel::onAddChecklistItem,
                    onToggle = viewModel::onToggleChecklistItem,
                    onRemove = viewModel::onRemoveChecklistItem,
                )
            }

            TaskSection(title = "Notes") {
                OutlinedTextField(
                    value = state.notes,
                    onValueChange = viewModel::onNotesChange,
                    label = { Text("Optional note") },
                    shape = TempoExtraShapes.card,
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = viewModel::save,
                enabled = state.isValid,
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Save task")
            }
        }
    }
}

@Composable
private fun TaskSection(title: String, content: @Composable () -> Unit) {
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
private fun TaskStepper(label: String, value: Int, onValueChange: (Int) -> Unit) {
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DuePicker(dueDate: java.time.LocalDate, onDueDateChange: (java.time.LocalDate) -> Unit) {
    var showPicker by remember { mutableStateOf(false) }
    val formatter = remember { DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM) }

    OutlinedButton(onClick = { showPicker = true }, shape = TempoExtraShapes.pill, modifier = Modifier.fillMaxWidth()) {
        Text(dueDate.format(formatter))
    }

    if (showPicker) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = dueDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli(),
        )
        Dialog(onDismissRequest = { showPicker = false }) {
            Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surface) {
                Column(modifier = Modifier.padding(8.dp)) {
                    DatePicker(state = state)
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(8.dp),
                        horizontalArrangement = Arrangement.End,
                    ) {
                        TextButton(onClick = { showPicker = false }) { Text("Cancel") }
                        TextButton(onClick = {
                            state.selectedDateMillis?.let { millis ->
                                onDueDateChange(Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault()).toLocalDate())
                            }
                            showPicker = false
                        }) { Text("Set") }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ReminderPicker(time: LocalTime?, onTimeChange: (LocalTime?) -> Unit) {
    var showPicker by remember { mutableStateOf(false) }
    val formatter = remember { DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT) }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        if (time != null) {
            FilterChip(
                selected = true,
                onClick = { onTimeChange(null) },
                label = { Text(time.format(formatter)) },
                shape = TempoExtraShapes.pill,
            )
        }
        OutlinedButton(onClick = { showPicker = true }, shape = TempoExtraShapes.pill) {
            Icon(Icons.Filled.Add, contentDescription = "Set reminder")
        }
    }

    if (showPicker) {
        val now = time ?: LocalTime.now()
        val state = rememberTimePickerState(initialHour = now.hour, initialMinute = now.minute, is24Hour = false)
        Dialog(onDismissRequest = { showPicker = false }) {
            Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surface) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    TimePicker(state = state)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { showPicker = false }) { Text("Cancel") }
                        Button(
                            onClick = {
                                onTimeChange(LocalTime.of(state.hour, state.minute))
                                showPicker = false
                            },
                            shape = TempoExtraShapes.pill,
                        ) { Text("Set") }
                    }
                }
            }
        }
    }
}

@Composable
private fun ChecklistEditor(
    items: List<TaskChecklistItem>,
    onAdd: (String) -> Unit,
    onToggle: (Int) -> Unit,
    onRemove: (Int) -> Unit,
) {
    var newLabel by remember { mutableStateOf("") }

    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        items.forEachIndexed { index, item ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = item.done, onCheckedChange = { onToggle(index) })
                    Text(item.label, style = MaterialTheme.typography.bodyLarge)
                }
                IconButton(onClick = { onRemove(index) }) {
                    Icon(Icons.Filled.Close, contentDescription = "Remove subtask")
                }
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = newLabel,
                onValueChange = { newLabel = it },
                label = { Text("Add subtask") },
                shape = TempoExtraShapes.card,
                modifier = Modifier.weight(1f),
            )
            IconButton(onClick = {
                onAdd(newLabel)
                newLabel = ""
            }) {
                Icon(Icons.Filled.Add, contentDescription = "Add subtask")
            }
        }
    }
}

private fun addTaskToDeviceCalendar(
    context: android.content.Context,
    title: String,
    notes: String,
    dueDate: java.time.LocalDate,
) {
    val startMillis = dueDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
    val intent = Intent(Intent.ACTION_INSERT).apply {
        data = CalendarContract.Events.CONTENT_URI
        putExtra(CalendarContract.EXTRA_EVENT_ALL_DAY, true)
        putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startMillis)
        putExtra(CalendarContract.EXTRA_EVENT_END_TIME, startMillis)
        putExtra(CalendarContract.Events.TITLE, title)
        putExtra(CalendarContract.Events.DESCRIPTION, notes)
    }
    runCatching { context.startActivity(intent) }
}

private fun RecurrenceType.taskLabel(): String = when (this) {
    RecurrenceType.DAILY -> "Daily"
    RecurrenceType.SPECIFIC_WEEKDAYS -> "Weekdays"
    RecurrenceType.EVERY_N_DAYS -> "Every N days"
    RecurrenceType.TIMES_PER_WEEK -> "X / week"
    RecurrenceType.MONTHLY_BY_DATE -> "Monthly"
}
