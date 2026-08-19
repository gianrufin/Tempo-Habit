package com.tempo.app.ui.screens.goals

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.GoalWithProgress
import com.tempo.app.ui.theme.TempoExtraShapes

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoalsScreen(
    onBack: () -> Unit,
    onAddGoal: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: GoalsViewModel = hiltViewModel(),
) {
    val goals by viewModel.goals.collectAsState()

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text("Goals") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onAddGoal) {
                        Icon(Icons.Filled.Add, contentDescription = "New goal")
                    }
                },
            )
        },
    ) { innerPadding ->
        if (goals.isEmpty()) {
            Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
                Text(
                    "No goals yet. Link a habit to a target and track it here.",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(16.dp),
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(innerPadding).fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(goals, key = { it.goal.id }) { goal ->
                    GoalCard(goal = goal, onArchive = { viewModel.onArchiveGoal(goal.goal.id) })
                }
            }
        }
    }
}

@Composable
private fun GoalCard(goal: GoalWithProgress, onArchive: () -> Unit) {
    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = goal.goal.title, style = MaterialTheme.typography.titleMedium)
                Row {
                    Text(
                        text = "${goal.completions} / ${goal.goal.targetCompletions}",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    IconButton(onClick = onArchive) {
                        Icon(Icons.Filled.Close, contentDescription = "Remove goal")
                    }
                }
            }
            goal.linkedHabit?.let {
                Text("${it.icon} ${it.name}", style = MaterialTheme.typography.bodySmall)
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(TempoExtraShapes.pill)
                    .background(MaterialTheme.colorScheme.surface),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(goal.progressFraction)
                        .height(10.dp)
                        .clip(TempoExtraShapes.pill)
                        .background(MaterialTheme.colorScheme.primary),
                )
            }
            if (goal.isComplete) {
                Text("🎉 Goal reached!", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}
