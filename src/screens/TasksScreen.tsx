import React, { useState } from 'react';
import { Task, TaskPriority } from '../types';
import { formatRecurrenceRule } from '../domain/recurrenceEngine';
import { Plus, CheckCircle2, Circle, Calendar, Repeat, CheckSquare, Trash2, Edit3, Download } from 'lucide-react';

interface TasksScreenProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
  onOpenAddTask: () => void;
  onOpenEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  onToggleTask,
  onToggleChecklistItem,
  onOpenAddTask,
  onOpenEditTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'RECURRING'>('ALL');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'PENDING') return !t.completed;
    if (filter === 'COMPLETED') return t.completed;
    if (filter === 'RECURRING') return t.isRecurring;
    return true;
  });

  const downloadIcs = (task: Task) => {
    if (!task.dueDate) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tempo Habit Tracker//EN
BEGIN:VEVENT
SUMMARY:${task.title}
DESCRIPTION:${task.notes || 'Created via Tempo'}
DTSTART:${task.dueDate.replace(/-/g, '')}T090000Z
DTEND:${task.dueDate.replace(/-/g, '')}T100000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${task.title.replace(/\s+/g, '_')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-28 px-4 sm:px-6 pt-4 max-w-3xl mx-auto">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Task Manager</h2>
          <p className="text-xs text-zinc-400">One-off actions & recurring to-dos</p>
        </div>

        <button
          onClick={onOpenAddTask}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-[#140e24] border border-purple-500/15 rounded-2xl mb-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: `All (${tasks.length})` },
          { id: 'PENDING', label: `Pending (${tasks.filter(t => !t.completed).length})` },
          { id: 'COMPLETED', label: `Completed (${tasks.filter(t => t.completed).length})` },
          { id: 'RECURRING', label: `Recurring (${tasks.filter(t => t.isRecurring).length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#140e24] border border-dashed border-purple-500/20">
          <p className="text-sm font-semibold text-zinc-300">No tasks in this category</p>
          <p className="text-xs text-zinc-500 mt-1">Keep yourself organized with clear priorities and subtasks.</p>
          <button
            onClick={onOpenAddTask}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
          >
            Create a Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const priorityBadge = {
              LOW: { label: 'Low', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
              MEDIUM: { label: 'Medium', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
              HIGH: { label: 'High', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
            }[task.priority];

            const completedChecklistCount = task.checklist.filter(c => c.done).length;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all ${
                  task.completed
                    ? 'bg-[#150f24]/70 border-white/5 opacity-75'
                    : 'bg-[#150f24] hover:bg-[#1a1330] border-purple-500/20 shadow-md shadow-purple-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Complete Checkbox + Title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-zinc-500 hover:text-amber-400 transition-colors flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 hover:text-amber-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold ${
                            task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${priorityBadge.color}`}
                        >
                          {priorityBadge.label}
                        </span>

                        {task.isRecurring && (
                          <span className="flex items-center gap-1 text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                            <Repeat className="w-3 h-3" />
                            {task.recurrenceRule ? formatRecurrenceRule(task.recurrenceRule) : 'Recurring'}
                          </span>
                        )}
                      </div>

                      {/* Due date or Notes preview */}
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1.5 flex-wrap">
                        {task.dueDate && !task.isRecurring && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            Due {task.dueDate}
                          </span>
                        )}

                        {task.notes && (
                          <p className="text-zinc-500 truncate max-w-xs">{task.notes}</p>
                        )}
                      </div>

                      {/* Checklist Subitems */}
                      {task.checklist && task.checklist.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1">
                            <span>Subtasks ({completedChecklistCount}/{task.checklist.length})</span>
                            <div className="w-20 h-1.5 bg-black/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{ width: `${(completedChecklistCount / task.checklist.length) * 100}%` }}
                              />
                            </div>
                          </div>

                          {task.checklist.map(item => (
                            <div
                              key={item.id}
                              onClick={() => onToggleChecklistItem(task.id, item.id)}
                              className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white cursor-pointer"
                            >
                              <CheckSquare
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  item.done ? 'text-amber-400' : 'text-zinc-600'
                                }`}
                              />
                              <span className={item.done ? 'line-through text-zinc-500' : ''}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {task.dueDate && !task.isRecurring && (
                      <button
                        onClick={() => downloadIcs(task)}
                        className="p-1.5 text-zinc-500 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-colors"
                        title="Download Calendar (.ics) event"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenEditTask(task)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this task?')) onDeleteTask(task.id);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
