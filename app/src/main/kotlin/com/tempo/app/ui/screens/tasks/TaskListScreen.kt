package com.tempo.app.ui.screens.tasks

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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.domain.model.TaskPriority
import com.tempo.app.domain.model.TaskWithTodayStatus
import com.tempo.app.ui.theme.OnGradient
import com.tempo.app.ui.theme.TempoExtraShapes
import com.tempo.app.ui.theme.TempoGradients

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskListScreen(
    modifier: Modifier = Modifier,
    onAddTask: () -> Unit = {},
    onOpenTask: (Long) -> Unit = {},
    viewModel: TaskListViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

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
            Text(
                text = "Tasks",
                style = MaterialTheme.typography.headlineMedium,
                color = OnGradient.textPrimary,
                modifier = Modifier.padding(20.dp),
            )

            if (state.isEmpty) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "No tasks yet. Tap + to add one.",
                        color = OnGradient.textSecondary,
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(20.dp, 0.dp, 20.dp, 140.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    if (state.singleTasks.isNotEmpty()) {
                        item(key = "single-header") {
                            Text(
                                text = "One-off",
                                style = MaterialTheme.typography.titleMedium,
                                color = OnGradient.textPrimary,
                            )
                        }
                        items(state.singleTasks, key = { "single-${it.task.id}" }) { item ->
                            TaskRow(
                                item = item,
                                onToggle = { viewModel.onToggleTask(item.task.id) },
                                onArchive = { viewModel.onArchiveTask(item.task.id) },
                                onClick = { onOpenTask(item.task.id) },
                            )
                        }
                    }
                    if (state.recurringTasks.isNotEmpty()) {
                        item(key = "recurring-header") {
                            Text(
                                text = "Recurring",
                                style = MaterialTheme.typography.titleMedium,
                                color = OnGradient.textPrimary,
                            )
                        }
                        items(state.recurringTasks, key = { "recurring-${it.task.id}" }) { item ->
                            TaskRow(
                                item = item,
                                onToggle = { viewModel.onToggleTask(item.task.id) },
                                onArchive = { viewModel.onArchiveTask(item.task.id) },
                                onClick = { onOpenTask(item.task.id) },
                            )
                        }
                    }
                }
            }
        }

        Surface(
            shape = CircleShape,
            color = OnGradient.surfaceStrong,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .navigationBarsPadding()
                .padding(end = 20.dp, bottom = 88.dp)
                .size(56.dp),
            onClick = onAddTask,
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                Icon(Icons.Filled.Add, contentDescription = "Add task", tint = OnGradient.textPrimary)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TaskRow(item: TaskWithTodayStatus, onToggle: () -> Unit, onArchive: () -> Unit, onClick: () -> Unit) {
    val done = item.isDoneForDate
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            when (value) {
                SwipeToDismissBoxValue.StartToEnd -> onToggle()
                SwipeToDismissBoxValue.EndToStart -> onArchive()
                SwipeToDismissBoxValue.Settled -> Unit
            }
            false
        },
    )

    SwipeToDismissBox(
        state = dismissState,
        modifier = Modifier.fillMaxWidth(),
        backgroundContent = { TaskSwipeBackground(dismissState.dismissDirection) },
    ) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = TempoExtraShapes.card,
        color = OnGradient.surface,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.task.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = OnGradient.textPrimary,
                    textDecoration = if (done) TextDecoration.LineThrough else null,
                )
                Text(
                    text = item.task.priority.priorityLabel(),
                    style = MaterialTheme.typography.bodySmall,
                    color = OnGradient.textSecondary,
                )
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
                        Icon(Icons.Filled.Check, contentDescription = null, tint = OnGradient.textPrimary, modifier = Modifier.size(16.dp))
                    }
                    Text(
                        text = if (done) "Done" else "Mark done",
                        style = MaterialTheme.typography.labelMedium,
                        color = OnGradient.textPrimary,
                    )
                }
            }
        }
    }
    }
}

@Composable
private fun TaskSwipeBackground(direction: SwipeToDismissBoxValue) {
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

private fun TaskPriority.priorityLabel(): String = "Priority: $label"
