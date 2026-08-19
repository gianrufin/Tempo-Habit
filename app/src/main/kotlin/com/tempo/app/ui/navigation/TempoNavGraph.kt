package com.tempo.app.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tempo.app.ui.components.FloatingBottomNav
import com.tempo.app.ui.components.FloatingNavItem
import com.tempo.app.ui.screens.calendar.CalendarScreen
import com.tempo.app.ui.screens.goals.AddEditGoalScreen
import com.tempo.app.ui.screens.goals.GoalsScreen
import com.tempo.app.ui.screens.habit.AddEditHabitScreen
import com.tempo.app.ui.screens.habit.HabitDetailScreen
import com.tempo.app.ui.screens.insights.InsightsScreen
import com.tempo.app.ui.screens.routine.AddEditRoutineScreen
import com.tempo.app.ui.screens.search.SearchScreen
import com.tempo.app.ui.screens.settings.SettingsScreen
import com.tempo.app.ui.screens.tasks.AddEditTaskScreen
import com.tempo.app.ui.screens.tasks.TaskListScreen
import com.tempo.app.ui.screens.timer.TimerScreen
import com.tempo.app.ui.screens.today.TodayScreen

private const val HABIT_ID_ARG = "habitId"
private const val ROUTINE_ID_ARG = "routineId"
private const val TASK_ID_ARG = "taskId"
private const val ROUTE_ADD_EDIT_HABIT = "habit/edit/{$HABIT_ID_ARG}?$ROUTINE_ID_ARG={$ROUTINE_ID_ARG}"
private const val ROUTE_HABIT_DETAIL = "habit/detail/{$HABIT_ID_ARG}"
private const val ROUTE_ADD_EDIT_ROUTINE = "routine/edit/{$ROUTINE_ID_ARG}"
private const val ROUTE_ADD_EDIT_TASK = "task/edit/{$TASK_ID_ARG}"
private const val ROUTE_SETTINGS = "settings"
private const val ROUTE_SEARCH = "search"
private const val ROUTE_GOALS = "goals"
private const val ROUTE_ADD_GOAL = "goal/new"

private fun editHabitRoute(habitId: Long) = "habit/edit/$habitId"
private fun addHabitRoute() = "habit/edit/0"
private fun habitDetailRoute(habitId: Long) = "habit/detail/$habitId"
private fun editRoutineRoute(routineId: Long) = "routine/edit/$routineId"
private fun addRoutineRoute() = "routine/edit/0"
private fun editTaskRoute(taskId: Long) = "task/edit/$taskId"
private fun addTaskRoute() = "task/edit/0"

/**
 * A plain Box, not a Scaffold: the floating pill nav is an overlay drawn on top of the current
 * screen's own full-bleed background, not a separate opaque bottomBar slot. Using Scaffold's
 * bottomBar here left a solid (non-transparent-looking) strip of the window's default background
 * wherever the pill's rounded shape didn't cover the full slot width.
 */
@Composable
fun TempoApp(
    navController: NavHostController = rememberNavController(),
    pendingShortcutAction: String? = null,
    onShortcutActionConsumed: () -> Unit = {},
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showBottomBar = TempoDestination.entries.any { it.route == currentRoute }

    LaunchedEffect(pendingShortcutAction) {
        when (pendingShortcutAction) {
            "add_habit" -> navController.navigate(addHabitRoute())
            "add_task" -> navController.navigate(addTaskRoute())
            "start_pomodoro" -> navController.navigate(TempoDestination.Timer.route)
            else -> return@LaunchedEffect
        }
        onShortcutActionConsumed()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        NavHost(
            navController = navController,
            startDestination = TempoDestination.Today.route,
            modifier = Modifier.fillMaxSize(),
        ) {
            composable(TempoDestination.Today.route) {
                TodayScreen(
                    onAddHabit = { navController.navigate(addHabitRoute()) },
                    onAddRoutine = { navController.navigate(addRoutineRoute()) },
                    onOpenHabit = { habitId -> navController.navigate(habitDetailRoute(habitId)) },
                    onOpenRoutine = { routineId -> navController.navigate(editRoutineRoute(routineId)) },
                    onOpenSettings = { navController.navigate(ROUTE_SETTINGS) },
                    onOpenSearch = { navController.navigate(ROUTE_SEARCH) },
                )
            }
            composable(TempoDestination.Calendar.route) { CalendarScreen() }
            composable(TempoDestination.Tasks.route) {
                TaskListScreen(
                    onAddTask = { navController.navigate(addTaskRoute()) },
                    onOpenTask = { taskId -> navController.navigate(editTaskRoute(taskId)) },
                )
            }
            composable(TempoDestination.Insights.route) {
                InsightsScreen(onOpenGoals = { navController.navigate(ROUTE_GOALS) })
            }
            composable(TempoDestination.Timer.route) { TimerScreen() }
            composable(ROUTE_SETTINGS) { SettingsScreen() }
            composable(ROUTE_SEARCH) {
                SearchScreen(
                    onBack = { navController.popBackStack() },
                    onOpenHabit = { habitId -> navController.navigate(habitDetailRoute(habitId)) },
                    onOpenTask = { taskId -> navController.navigate(editTaskRoute(taskId)) },
                )
            }
            composable(ROUTE_GOALS) {
                GoalsScreen(
                    onBack = { navController.popBackStack() },
                    onAddGoal = { navController.navigate(ROUTE_ADD_GOAL) },
                )
            }
            composable(ROUTE_ADD_GOAL) {
                AddEditGoalScreen(onDone = { navController.popBackStack() })
            }
            composable(
                route = ROUTE_ADD_EDIT_TASK,
                arguments = listOf(navArgument(TASK_ID_ARG) { type = NavType.LongType; defaultValue = 0L }),
            ) {
                AddEditTaskScreen(onDone = { navController.popBackStack() })
            }
            composable(
                route = ROUTE_ADD_EDIT_HABIT,
                arguments = listOf(
                    navArgument(HABIT_ID_ARG) { type = NavType.LongType; defaultValue = 0L },
                    navArgument(ROUTINE_ID_ARG) { type = NavType.LongType; defaultValue = -1L },
                ),
            ) {
                AddEditHabitScreen(onDone = { navController.popBackStack() })
            }
            composable(
                route = ROUTE_HABIT_DETAIL,
                arguments = listOf(navArgument(HABIT_ID_ARG) { type = NavType.LongType }),
            ) {
                HabitDetailScreen(
                    onBack = { navController.popBackStack() },
                    onEdit = { habitId -> navController.navigate(editHabitRoute(habitId)) },
                )
            }
            composable(
                route = ROUTE_ADD_EDIT_ROUTINE,
                arguments = listOf(navArgument(ROUTINE_ID_ARG) { type = NavType.LongType; defaultValue = 0L }),
            ) {
                AddEditRoutineScreen(
                    onDone = { navController.popBackStack() },
                    onAddHabitToRoutine = { routineId -> navController.navigate("habit/edit/0?routineId=$routineId") },
                )
            }
        }

        if (showBottomBar) {
            TempoBottomNavBar(
                navController = navController,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding(),
            )
        }
    }
}

@Composable
private fun TempoBottomNavBar(navController: NavHostController, modifier: Modifier = Modifier) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val items = TempoDestination.entries.map { destination ->
        val selected = currentRoute == destination.route
        FloatingNavItem(
            label = destination.label,
            icon = if (selected) destination.selectedIcon else destination.unselectedIcon,
            selected = selected,
            onClick = {
                navController.navigate(destination.route) {
                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            },
        )
    }
    FloatingBottomNav(items = items, modifier = modifier)
}
