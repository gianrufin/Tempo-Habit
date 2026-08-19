package com.tempo.app.ui.screens.routine

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
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
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.TimeOfDay
import com.tempo.app.ui.theme.TempoExtraShapes

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditRoutineScreen(
    onDone: () -> Unit,
    onAddHabitToRoutine: (Long) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AddEditRoutineViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val habits by viewModel.habitsInRoutine.collectAsState()

    LaunchedEffect(state.isDeleted) {
        if (state.isDeleted) onDone()
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text(if (state.routineId == null) "New routine" else "Edit routine") },
                navigationIcon = {
                    IconButton(onClick = onDone) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (state.routineId != null) {
                        IconButton(onClick = viewModel::deleteRoutine) {
                            Icon(Icons.Filled.Delete, contentDescription = "Delete routine")
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
                label = { Text("Routine name") },
                shape = TempoExtraShapes.card,
                modifier = Modifier.fillMaxWidth(),
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Icon", style = MaterialTheme.typography.titleMedium)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(AddEditRoutineUiState.DEFAULT_ICONS) { icon ->
                        FilterChip(
                            selected = state.icon == icon,
                            onClick = { viewModel.onIconChange(icon) },
                            label = { Text(icon) },
                            shape = TempoExtraShapes.pill,
                        )
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Time of day", style = MaterialTheme.typography.titleMedium)
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

            Button(
                onClick = viewModel::save,
                enabled = state.isValid,
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (state.routineId == null) "Create routine" else "Save changes")
            }

            if (state.routineId != null) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Habits in this routine", style = MaterialTheme.typography.titleMedium)
                    habits.forEach { habit ->
                        RoutineHabitRow(habit = habit, onRemove = { viewModel.removeHabitFromRoutine(habit.id) })
                    }
                    OutlinedButton(
                        onClick = { onAddHabitToRoutine(state.routineId!!) },
                        shape = TempoExtraShapes.pill,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null)
                        Text("  Add habit to routine")
                    }
                }
            }
        }
    }
}

@Composable
private fun RoutineHabitRow(habit: Habit, onRemove: () -> Unit) {
    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("${habit.icon}  ${habit.name}")
            IconButton(onClick = onRemove) {
                Icon(Icons.Filled.Close, contentDescription = "Remove from routine")
            }
        }
    }
}
