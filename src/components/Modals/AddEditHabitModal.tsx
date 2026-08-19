import React, { useState } from 'react';
import { Habit, RecurrenceType, TimeOfDay } from '../../types';
import { formatLocalDate, addDays } from '../../domain/recurrenceEngine';
import { X, Trash2, Plus, Minus, Check, Clock } from 'lucide-react';

interface AddEditHabitModalProps {
  habit?: Habit | null; // if null, creating new
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
}

const DEFAULT_ICONS = ['💧', '🏃', '📚', '🧘', '⚡', '🌙', '✍️', '🤸', '💊', '🎯', '🥗', '☕', '🎨', '🚴', '🏊'];
const DEFAULT_COLORS = ['#38BDF8', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#EAB308'];
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
  const [icon, setIcon] = useState(habit?.icon || '💧');
  const [color, setColor] = useState(habit?.color || '#38BDF8');
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
      orderIndex: habit?.orderIndex || 0,
    };

    onSave(updatedHabit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[90vh] bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#18112b]">
          <h2 className="text-lg font-bold text-white">
            {habit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <div className="flex items-center gap-2">
            {habit && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this habit and all its history?')) {
                    onDelete(habit.id);
                    onClose();
                  }
                }}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                title="Delete habit"
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

        {/* Modal Content Scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Read 20 pages"
              className="w-full px-4 py-3 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === ic
                      ? 'bg-purple-600 text-white ring-2 ring-amber-400 scale-105'
                      : 'bg-[#1b1330] hover:bg-[#251a42] text-zinc-300'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Color Theme
            </label>
            <div className="flex flex-wrap gap-2.5">
              {DEFAULT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule / Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Frequency & Recurrence
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
              {(['DAILY', 'SPECIFIC_WEEKDAYS', 'EVERY_N_DAYS', 'TIMES_PER_WEEK', 'MONTHLY_BY_DATE'] as RecurrenceType[]).map(t => {
                const labels: Record<RecurrenceType, string> = {
                  DAILY: 'Daily',
                  SPECIFIC_WEEKDAYS: 'Weekdays',
                  EVERY_N_DAYS: 'Interval',
                  TIMES_PER_WEEK: 'X/week',
                  MONTHLY_BY_DATE: 'Monthly',
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRecurrenceType(t)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                      recurrenceType === t
                        ? 'bg-purple-600 text-white font-semibold shadow-sm'
                        : 'bg-[#1b1330] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {/* Recurrence Specific options */}
            {recurrenceType === 'SPECIFIC_WEEKDAYS' && (
              <div className="flex gap-1.5 justify-between">
                {WEEKDAYS.map(w => {
                  const isSel = weekdays.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWeekday(w.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isSel ? 'bg-amber-400 text-black' : 'bg-[#1b1330] text-zinc-400 hover:bg-[#251a42]'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            )}

            {recurrenceType === 'EVERY_N_DAYS' && (
              <div className="flex items-center gap-3 p-3 bg-[#1b1330] rounded-xl">
                <span className="text-zinc-300">Repeat every</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEveryNDays(Math.max(1, everyNDays - 1))}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-amber-300">{everyNDays}</span>
                  <button
                    type="button"
                    onClick={() => setEveryNDays(everyNDays + 1)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-zinc-300">days</span>
              </div>
            )}

            {recurrenceType === 'TIMES_PER_WEEK' && (
              <div className="flex items-center gap-3 p-3 bg-[#1b1330] rounded-xl">
                <span className="text-zinc-300">Target</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimesPerWeek(Math.max(1, timesPerWeek - 1))}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-amber-300">{timesPerWeek}</span>
                  <button
                    type="button"
                    onClick={() => setTimesPerWeek(Math.min(7, timesPerWeek + 1))}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-zinc-300">times every week</span>
              </div>
            )}

            {recurrenceType === 'MONTHLY_BY_DATE' && (
              <div className="flex items-center gap-3 p-3 bg-[#1b1330] rounded-xl">
                <span className="text-zinc-300">On Day</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonthlyDay(Math.max(1, monthlyDay - 1))}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-amber-300">{monthlyDay}</span>
                  <button
                    type="button"
                    onClick={() => setMonthlyDay(Math.min(31, monthlyDay + 1))}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-zinc-300">of each month</span>
              </div>
            )}
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Time of Day
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANYTIME'] as TimeOfDay[]).map(tod => (
                <button
                  key={tod}
                  type="button"
                  onClick={() => setTimeOfDay(tod)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium capitalize transition-all ${
                    timeOfDay === tod
                      ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold shadow-sm'
                      : 'bg-[#1b1330] text-zinc-400 hover:text-white'
                  }`}
                >
                  {tod.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Streak Freezes & Grace Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-[#1b1330] rounded-xl">
              <label className="block text-xs text-zinc-400 mb-1">Streak Freezes (per week)</label>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300">{streakFreezes} freezes</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStreakFreezes(Math.max(0, streakFreezes - 1))}
                    className="p-1 rounded bg-white/5 hover:bg-white/10"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStreakFreezes(streakFreezes + 1)}
                    className="p-1 rounded bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1b1330] rounded-xl">
              <label className="block text-xs text-zinc-400 mb-1">Grace Period</label>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300">{graceDays} day(s)</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setGraceDays(Math.max(0, graceDays - 1))}
                    className="p-1 rounded bg-white/5 hover:bg-white/10"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGraceDays(graceDays + 1)}
                    className="p-1 rounded bg-white/5 hover:bg-white/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Reminders
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {reminders.map(t => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 px-3 py-1 bg-purple-900/40 border border-purple-500/30 text-purple-200 rounded-full text-xs font-medium"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveReminder(t)}
                    className="hover:text-white ml-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="time"
                  value={newReminder}
                  onChange={e => setNewReminder(e.target.value)}
                  className="px-2 py-1 bg-[#0d0818] border border-purple-500/20 rounded-lg text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddReminder}
                  className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Vacation Mode if editing existing habit */}
          {habit && (
            <div className="p-3.5 bg-gradient-to-r from-purple-950/40 to-slate-950 border border-purple-500/20 rounded-2xl">
              <span className="text-xs font-bold text-amber-300 block mb-1">Vacation Mode</span>
              {pausedUntil && pausedUntil >= formatLocalDate(new Date()) ? (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-300">
                    Habit is paused until <span className="font-bold text-white">{pausedUntil}</span>. It won't penalize your streak.
                  </p>
                  <button
                    type="button"
                    onClick={handleResume}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
                  >
                    Resume Habit Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400">
                    Going away? Pause this habit to preserve your active streaks while traveling.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePauseDays(3)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-xs rounded-lg text-zinc-300"
                    >
                      3 days
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePauseDays(7)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-xs rounded-lg text-zinc-300"
                    >
                      1 week
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePauseDays(14)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-xs rounded-lg text-zinc-300"
                    >
                      2 weeks
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 bg-[#18112b] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium rounded-xl hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {habit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
};
