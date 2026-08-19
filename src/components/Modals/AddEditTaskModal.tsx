import React, { useState } from 'react';
import { Task, TaskPriority, TaskChecklistItem, RecurrenceType } from '../../types';
import { formatLocalDate } from '../../domain/recurrenceEngine';
import { X, Trash2, Plus, Calendar, CheckSquare } from 'lucide-react';

interface AddEditTaskModalProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

export const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(task?.title || '');
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [dueDate, setDueDate] = useState(task?.dueDate || formatLocalDate(new Date()));
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(task?.recurrenceRule?.type || 'DAILY');
  const [weekdays, setWeekdays] = useState<number[]>(task?.recurrenceRule?.weekdays || [1, 2, 3, 4, 5]);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'MEDIUM');
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>(task?.checklist || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [notes, setNotes] = useState(task?.notes || '');
  const [reminderTime, setReminderTime] = useState<string | null>(task?.reminderTime || null);

  const toggleWeekday = (id: number) => {
    if (weekdays.includes(id)) {
      if (weekdays.length > 1) setWeekdays(weekdays.filter(d => d !== id));
    } else {
      setWeekdays([...weekdays, id]);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setChecklist([...checklist, { id: `c-${Date.now()}`, label: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  const handleToggleSubtask = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleRemoveSubtask = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const updatedTask: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: title.trim(),
      isRecurring,
      dueDate: !isRecurring ? dueDate : undefined,
      recurrenceRule: isRecurring ? {
        type: recurrenceType,
        weekdays: recurrenceType === 'SPECIFIC_WEEKDAYS' ? weekdays : undefined,
      } : undefined,
      priority,
      checklist,
      notes: notes.trim() || undefined,
      reminderTime,
      completed: task?.completed || false,
      completedAt: task?.completedAt,
      createdAt: task?.createdAt || formatLocalDate(new Date()),
      orderIndex: task?.orderIndex || 0,
    };

    onSave(updatedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[90vh] bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#18112b]">
          <h2 className="text-lg font-bold text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <div className="flex items-center gap-2">
            {task && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          {/* Task Type: One-off vs Recurring */}
          <div className="flex items-center justify-between p-3.5 bg-[#1b1330] rounded-2xl border border-white/5">
            <div>
              <span className="font-semibold text-white block text-sm">
                {isRecurring ? 'Recurring Schedule' : 'One-off Task'}
              </span>
              <span className="text-xs text-zinc-400">
                {isRecurring ? 'Repeats on a scheduled frequency' : 'Single deadline with due date'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRecurring ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRecurring ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Due date or Recurrence */}
          {!isRecurring ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Due Date
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Recurrence Frequency
              </label>
              <div className="flex gap-2 mb-3">
                {(['DAILY', 'SPECIFIC_WEEKDAYS'] as RecurrenceType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRecurrenceType(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      recurrenceType === t ? 'bg-purple-600 text-white' : 'bg-[#1b1330] text-zinc-400'
                    }`}
                  >
                    {t === 'DAILY' ? 'Daily' : 'Specific Weekdays'}
                  </button>
                ))}
              </div>
              {recurrenceType === 'SPECIFIC_WEEKDAYS' && (
                <div className="flex gap-1.5 justify-between">
                  {WEEKDAYS.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWeekday(w.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        weekdays.includes(w.id) ? 'bg-amber-400 text-black' : 'bg-[#1b1330] text-zinc-400'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map(p => {
                const styles = {
                  LOW: 'text-sky-300 border-sky-500/30',
                  MEDIUM: 'text-amber-300 border-amber-500/30',
                  HIGH: 'text-rose-300 border-rose-500/30',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      priority === p
                        ? `${styles[p]} bg-white/10 ring-2 ring-white/20 scale-102`
                        : 'bg-[#1b1330] border-transparent text-zinc-400'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist / Subtasks */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Checklist / Subtasks ({checklist.length})
            </label>
            <div className="space-y-2 mb-2">
              {checklist.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-[#0d0818] border border-purple-500/10 rounded-xl"
                >
                  <div
                    onClick={() => handleToggleSubtask(item.id)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <CheckSquare
                      className={`w-4 h-4 ${item.done ? 'text-amber-400' : 'text-zinc-500'}`}
                    />
                    <span className={`text-xs ${item.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {item.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(item.id)}
                    className="text-zinc-500 hover:text-rose-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add step or subtask..."
                className="flex-1 px-3 py-2 bg-[#0d0818] border border-purple-500/20 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes, links, or context..."
              className="w-full px-4 py-2.5 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#18112b] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/40 disabled:opacity-50"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};
