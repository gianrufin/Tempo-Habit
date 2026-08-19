package com.tempo.app.ui.screens.tasks

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.alarm.AlarmRescheduler
import com.tempo.app.data.repository.TaskRepository
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.Task
import com.tempo.app.domain.model.TaskChecklistItem
import com.tempo.app.domain.model.TaskPriority
import com.tempo.app.ui.screens.habit.RecurrenceType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import javax.inject.Inject

data class AddEditTaskUiState(
    val taskId: Long? = null,
    val title: String = "",
    val notes: String = "",
    val isRecurring: Boolean = false,
    val recurrenceType: RecurrenceType = RecurrenceType.DAILY,
    val selectedWeekdays: Set<DayOfWeek> = setOf(DayOfWeek.MONDAY),
    val everyNDays: Int = 2,
    val timesPerWeek: Int = 3,
    val monthlyDayOfMonth: Int = 1,
    val dueDate: LocalDate = LocalDate.now(),
    val reminderTime: LocalTime? = null,
    val priority: TaskPriority = TaskPriority.MEDIUM,
    val checklist: List<TaskChecklistItem> = emptyList(),
    val isSaved: Boolean = false,
) {
    val isValid: Boolean get() = title.isNotBlank()
}

@HiltViewModel
class AddEditTaskViewModel @Inject constructor(
    private val repository: TaskRepository,
    private val alarmRescheduler: AlarmRescheduler,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val taskIdArg: Long? = savedStateHandle.get<Long>("taskId")?.takeIf { it != 0L }

    private val _uiState = MutableStateFlow(AddEditTaskUiState(taskId = taskIdArg))
    val uiState = _uiState.asStateFlow()

    init {
        taskIdArg?.let { id ->
            viewModelScope.launch {
                repository.getTask(id)?.let { task -> _uiState.value = task.toUiState() }
                val checklist = repository.getChecklist(id)
                _uiState.value = _uiState.value.copy(checklist = checklist)
            }
        }
    }

    fun onTitleChange(value: String) = update { it.copy(title = value) }
    fun onNotesChange(value: String) = update { it.copy(notes = value) }
    fun onIsRecurringChange(value: Boolean) = update { it.copy(isRecurring = value) }
    fun onRecurrenceTypeChange(value: RecurrenceType) = update { it.copy(recurrenceType = value) }
    fun onToggleWeekday(day: DayOfWeek) = update {
        val current = it.selectedWeekdays
        it.copy(selectedWeekdays = if (day in current) current - day else current + day)
    }
    fun onEveryNDaysChange(value: Int) = update { it.copy(everyNDays = value.coerceIn(1, 60)) }
    fun onTimesPerWeekChange(value: Int) = update { it.copy(timesPerWeek = value.coerceIn(1, 7)) }
    fun onMonthlyDayChange(value: Int) = update { it.copy(monthlyDayOfMonth = value.coerceIn(1, 31)) }
    fun onDueDateChange(value: LocalDate) = update { it.copy(dueDate = value) }
    fun onReminderTimeChange(value: LocalTime?) = update { it.copy(reminderTime = value) }
    fun onPriorityChange(value: TaskPriority) = update { it.copy(priority = value) }

    fun onAddChecklistItem(label: String) {
        if (label.isBlank()) return
        update { it.copy(checklist = it.checklist + TaskChecklistItem(taskId = it.taskId ?: 0L, label = label.trim())) }
    }

    fun onToggleChecklistItem(index: Int) = update {
        it.copy(checklist = it.checklist.mapIndexed { i, item -> if (i == index) item.copy(done = !item.done) else item })
    }

    fun onRemoveChecklistItem(index: Int) = update {
        it.copy(checklist = it.checklist.filterIndexed { i, _ -> i != index })
    }

    fun save() {
        val state = _uiState.value
        if (!state.isValid) return
        viewModelScope.launch {
            val task = Task(
                id = state.taskId ?: 0L,
                title = state.title.trim(),
                notes = state.notes.trim(),
                isRecurring = state.isRecurring,
                recurrenceRule = if (state.isRecurring) state.toRecurrenceRule() else null,
                dueDate = if (state.isRecurring) null else state.dueDate,
                reminderTime = state.reminderTime,
                priority = state.priority,
                createdAt = LocalDate.now(),
            )
            val savedId: Long
            if (state.taskId == null) {
                savedId = repository.addTask(task)
            } else {
                val existing = repository.getTask(state.taskId) ?: return@launch
                savedId = state.taskId
                repository.updateTask(existing.copy(
                    title = task.title,
                    notes = task.notes,
                    isRecurring = task.isRecurring,
                    recurrenceRule = task.recurrenceRule,
                    dueDate = task.dueDate,
                    reminderTime = task.reminderTime,
                    priority = task.priority,
                ))
            }
            repository.replaceChecklist(savedId, state.checklist)
            alarmRescheduler.rescheduleTask(savedId)
            _uiState.value = _uiState.value.copy(isSaved = true)
        }
    }

    fun delete() {
        val id = _uiState.value.taskId ?: return
        viewModelScope.launch {
            repository.archiveTask(id)
            alarmRescheduler.rescheduleTask(id)
            _uiState.value = _uiState.value.copy(isSaved = true)
        }
    }

    private fun update(transform: (AddEditTaskUiState) -> AddEditTaskUiState) {
        _uiState.value = transform(_uiState.value)
    }

    private fun Task.toUiState(): AddEditTaskUiState {
        val base = AddEditTaskUiState(
            taskId = id,
            title = title,
            notes = notes,
            isRecurring = isRecurring,
            dueDate = dueDate ?: LocalDate.now(),
            reminderTime = reminderTime,
            priority = priority,
        )
        return when (val rule = recurrenceRule) {
            null -> base
            is RecurrenceRule.Daily -> base.copy(recurrenceType = RecurrenceType.DAILY)
            is RecurrenceRule.SpecificWeekdays -> base.copy(
                recurrenceType = RecurrenceType.SPECIFIC_WEEKDAYS,
                selectedWeekdays = rule.weekdays,
            )
            is RecurrenceRule.EveryNDays -> base.copy(
                recurrenceType = RecurrenceType.EVERY_N_DAYS,
                everyNDays = rule.n,
            )
            is RecurrenceRule.TimesPerWeek -> base.copy(
                recurrenceType = RecurrenceType.TIMES_PER_WEEK,
                timesPerWeek = rule.times,
            )
            is RecurrenceRule.MonthlyByDate -> base.copy(
                recurrenceType = RecurrenceType.MONTHLY_BY_DATE,
                monthlyDayOfMonth = rule.dayOfMonth,
            )
        }
    }

    private fun AddEditTaskUiState.toRecurrenceRule(): RecurrenceRule = when (recurrenceType) {
        RecurrenceType.DAILY -> RecurrenceRule.Daily
        RecurrenceType.SPECIFIC_WEEKDAYS -> RecurrenceRule.SpecificWeekdays(
            selectedWeekdays.ifEmpty { setOf(LocalDate.now().dayOfWeek) },
        )
        RecurrenceType.EVERY_N_DAYS -> RecurrenceRule.EveryNDays(everyNDays, LocalDate.now().toEpochDay())
        RecurrenceType.TIMES_PER_WEEK -> RecurrenceRule.TimesPerWeek(timesPerWeek)
        RecurrenceType.MONTHLY_BY_DATE -> RecurrenceRule.MonthlyByDate(monthlyDayOfMonth)
    }
}
