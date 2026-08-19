import React, { useState } from 'react';
import { Habit, RecurrenceType, TimeOfDay } from '../../types';
import { formatLocalDate, addDays } from '../../domain/recurrenceEngine';
import { X, Trash2, Plus, Minus, Check, Clock } from 'lucide-react';
import { SquircleIcon, AVAILABLE_ICON_KEYS } from '../SquircleIcon';

interface AddEditHabitModalProps {
  habit?: Habit | null; // if null, creating new
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
}

const DEFAULT_ICONS = AVAILABLE_ICON_KEYS;
const DEFAULT_COLORS = ['#7C69EF', '#FF8522', '#10B981', '#38BDF8', '#EC4899', '#6366F1', '#14B8A6', '#F59E0B', '#8B5CF6'];
const WEEKDAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

export const AddEditHabitModal: React.FC<AddEditHabitModalProps> = ({
  habit,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(habit?.name || '');
  const [icon, setIcon] = useState(habit?.icon || 'zap');
  const [color, setColor] = useState(habit?.color || '#7C69EF');
  const [category, setCategory] = useState(habit?.category || 'Health');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(habit?.recurrenceRule.type || 'DAILY');
  const [weekdays, setWeekdays] = useState<number[]>(habit?.recurrenceRule.weekdays || [1, 2, 3, 4, 5]);
  const [everyNDays, setEveryNDays] = useState(habit?.recurrenceRule.everyNDays || 2);
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.recurrenceRule.timesPerWeek || 3);
  const [monthlyDay, setMonthlyDay] = useState(habit?.recurrenceRule.monthlyDayOfMonth || 1);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(habit?.timeOfDay || 'MORNING');
  const [streakFreezes, setStreakFreezes] = useState(habit?.streakFreezeAllowance ?? 1);
  const [graceDays, setGraceDays] = useState(habit?.graceDays ?? 0);
  const [reminders, setReminders] = useState<string[]>(habit?.reminderTimes || ['08:00']);
  const [newReminder, setNewReminder] = useState('08:00');
  const [pausedUntil, setPausedUntil] = useState<string | null>(habit?.pausedUntil || null);

  const toggleWeekday = (id: number) => {
    if (weekdays.includes(id)) {
      if (weekdays.length > 1) {
        setWeekdays(weekdays.filter(d => d !== id));
      }
    } else {
      setWeekdays([...weekdays, id]);
    }
  };

  const handleAddReminder = () => {
    if (newReminder && !reminders.includes(newReminder)) {
      setReminders([...reminders, newReminder]);
    }
  };

  const handleRemoveReminder = (time: string) => {
    setReminders(reminders.filter(t => t !== time));
  };

  const handlePauseDays = (days: number) => {
    const target = formatLocalDate(addDays(new Date(), days));
    setPausedUntil(target);
  };

  const handleResume = () => {
    setPausedUntil(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const updatedHabit: Habit = {
      id: habit?.id || `habit-${Date.now()}`,
      name: name.trim(),
      icon,
      color,
      category,
      recurrenceRule: {
        type: recurrenceType,
        weekdays: recurrenceType === 'SPECIFIC_WEEKDAYS' ? weekdays : undefined,
        everyNDays: recurrenceType === 'EVERY_N_DAYS' ? everyNDays : undefined,
        timesPerWeek: recurrenceType === 'TIMES_PER_WEEK' ? timesPerWeek : undefined,
        monthlyDayOfMonth: recurrenceType === 'MONTHLY_BY_DATE' ? monthlyDay : undefined,
      },
      timeOfDay,
      createdAt: habit?.createdAt || formatLocalDate(new Date()),
      reminderTimes: reminders,
      streakFreezeAllowance: streakFreezes,
      graceDays,
      pausedUntil,
      routineId: habit?.routineId || null,
      orderIndex: habit?.orderIndex ?? 0,
    };

    onSave(updatedHabit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161026] text-zinc-900 dark:text-zinc-100 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-black/5 dark:border-white/10 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-[#1a1330]">
          <div className="flex items-center gap-3">
            <SquircleIcon name={icon} color={color} size="md" variant="solid" />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {habit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <p className="text-xs text-zinc-500">Customize recurrence, time, and reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Name & Category */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                Habit Title *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Read 15 Pages, 10 Min Meditation..."
                className="w-full text-sm font-semibold p-3.5 rounded-2xl bg-purple-50/50 dark:bg-[#1f1638] border border-purple-200 dark:border-purple-800/40 text-zinc-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-2xl bg-zinc-50 dark:bg-[#1f1638] border border-black/5 dark:border-white/5 outline-none"
                >
                  <option value="Health">Health</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Learning">Learning</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Creativity">Creativity</option>
                  <option value="Lifestyle">Lifestyle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Time of Day
                </label>
                <select
                  value={timeOfDay}
                  onChange={e => setTimeOfDay(e.target.value as TimeOfDay)}
                  className="w-full text-xs font-semibold p-3 rounded-2xl bg-zinc-50 dark:bg-[#1f1638] border border-black/5 dark:border-white/5 outline-none"
                >
                  <option value="MORNING">Morning</option>
                  <option value="AFTERNOON">Afternoon</option>
                  <option value="EVENING">Evening</option>
                  <option value="NIGHT">Night</option>
                  <option value="ANYTIME">Anytime</option>
                </select>
              </div>
            </div>
          </div>

          {/* Squircle Line Icon Selector (Zero Emojis) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Squircle Line Icon
            </label>
            <div className="flex items-center gap-2 overflow-x-auto p-1 no-scrollbar">
              {DEFAULT_ICONS.map(iKey => {
                const isSelected = icon === iKey;
                return (
                  <button
                    key={iKey}
                    type="button"
                    onClick={() => setIcon(iKey)}
                    className={`p-1 rounded-2xl transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-purple-600 scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <SquircleIcon name={iKey} color={color} size="sm" variant={isSelected ? 'solid' : 'soft'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Accent Color
            </label>
            <div className="flex items-center gap-2.5 overflow-x-auto p-1 no-scrollbar">
              {DEFAULT_COLORS.map(c => {
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-offset-2 ring-purple-600 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurrence Rule */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-50 dark:bg-[#1f1638] border border-black/5 dark:border-white/5">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Recurrence Schedule
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'DAILY', label: 'Every Day' },
                { type: 'SPECIFIC_WEEKDAYS', label: 'Specific Days' },
                { type: 'EVERY_N_DAYS', label: 'Interval (Every N)' },
                { type: 'TIMES_PER_WEEK', label: 'Times per Week' },
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setRecurrenceType(item.type as RecurrenceType)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    recurrenceType === item.type
                      ? 'bg-[#7C69EF] text-white shadow-sm'
                      : 'bg-white dark:bg-[#161026] text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {recurrenceType === 'SPECIFIC_WEEKDAYS' && (
              <div className="flex items-center justify-between gap-1 pt-2">
                {WEEKDAYS.map(w => {
                  const isChecked = weekdays.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWeekday(w.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#7C69EF] text-white'
                          : 'bg-white dark:bg-[#161026] text-zinc-400 border border-black/5 dark:border-white/5'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reminder Times */}
          <div className="space-y-2 p-4 rounded-2xl bg-zinc-50 dark:bg-[#1f1638] border border-black/5 dark:border-white/5">
            <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Reminder Alerts
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newReminder}
                onChange={e => setNewReminder(e.target.value)}
                className="text-xs font-bold py-2 px-3 rounded-xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 outline-none"
              />
              <button
                type="button"
                onClick={handleAddReminder}
                className="py-2 px-3 rounded-xl bg-[#7C69EF] text-white font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Alert</span>
              </button>
            </div>

            {reminders.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {reminders.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-mono text-xs font-bold"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReminder(t)}
                      className="hover:text-red-500 cursor-pointer ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-[#1a1330] flex items-center justify-between">
          {habit && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(habit.id);
                onClose();
              }}
              className="p-2.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Delete Habit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="py-2.5 px-6 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-900/20 active:scale-95 transition-all cursor-pointer"
            >
              Save Habit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
