package com.tempo.app.ui.screens.goals

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.ui.theme.TempoExtraShapes

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditGoalScreen(
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AddEditGoalViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()
    val habits by viewModel.availableHabits.collectAsState()
    var habitPickerExpanded by remember { mutableStateOf(false) }

    LaunchedEffect(state.isSaved) {
        if (state.isSaved) onDone()
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text("New goal") },
                navigationIcon = {
                    IconButton(onClick = onDone) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier.padding(innerPadding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            OutlinedTextField(
                value = state.title,
                onValueChange = viewModel::onTitleChange,
                label = { Text("Goal title") },
                shape = TempoExtraShapes.card,
                modifier = Modifier.fillMaxWidth(),
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Linked habit", style = MaterialTheme.typography.titleMedium)
                val linkedHabit = habits.firstOrNull { it.id == state.linkedHabitId }
                OutlinedButton(onClick = { habitPickerExpanded = true }, shape = TempoExtraShapes.pill) {
                    Text(linkedHabit?.let { "${it.icon} ${it.name}" } ?: "Choose a habit")
                }
                DropdownMenu(expanded = habitPickerExpanded, onDismissRequest = { habitPickerExpanded = false }) {
                    habits.forEach { habit ->
                        DropdownMenuItem(
                            text = { Text("${habit.icon} ${habit.name}") },
                            onClick = { viewModel.onLinkedHabitChange(habit.id); habitPickerExpanded = false },
                        )
                    }
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Target completions", style = MaterialTheme.typography.titleMedium)
                Row {
                    OutlinedButton(onClick = { viewModel.onTargetCompletionsChange(state.targetCompletions - 5) }, shape = TempoExtraShapes.pill) {
                        Text("-5")
                    }
                    Text(
                        "${state.targetCompletions}",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(horizontal = 20.dp),
                    )
                    OutlinedButton(onClick = { viewModel.onTargetCompletionsChange(state.targetCompletions + 5) }, shape = TempoExtraShapes.pill) {
                        Text("+5")
                    }
                }
            }

            Button(
                onClick = viewModel::save,
                enabled = state.isValid,
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Save goal")
            }
        }
    }
}
