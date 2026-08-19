import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Edit2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Habit, HabitCompletion, Routine, Task, TimeOfDay } from '../types';
import { formatLocalDate, addDays } from '../domain/recurrenceEngine';
import { sortHabitsAscending } from '../domain/habitSorter';
import { SquircleIcon } from '../components/SquircleIcon';

interface CalendarScreenProps {
  habits: Habit[];
  routines: Routine[];
  tasks: Task[];
  completions: HabitCompletion[];
  onToggleHabit: (habitId: string, date: string) => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  habits,
  routines,
  tasks,
  completions,
  onToggleHabit,
  onAddHabit,
  onEditHabit,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(formatLocalDate(new Date()));

  const today = new Date();
  const todayStr = formatLocalDate(today);

  // Generate continuous horizontal dates for top calendar strip
  const dateStrip = [-3, -2, -1, 0, 1, 2, 3, 4, 5].map(offset => {
    const d = addDays(today, offset);
    const dateStr = formatLocalDate(d);
    return {
      dateStr,
      dayNum: String(d.getDate()).padStart(2, '0'),
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    };
  });

  const completionMap = new Map<string, HabitCompletion>();
  completions.forEach(c => {
    if (c.date === selectedDate) {
      completionMap.set(c.habitId, c);
    }
  });

  const sortedHabits = sortHabitsAscending(habits);

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-6 animate-fade-in">
      {/* 1. Header Date Strip (Screen 2 Top) */}
      <div className="bg-white dark:bg-[#161026] p-3.5 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Schedule Timeline
          </span>
          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {dateStrip.map(item => (
            <button
              key={item.dateStr}
              onClick={() => setSelectedDate(item.dateStr)}
              className={`flex-1 min-w-[40px] py-2 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                item.isSelected
                  ? 'bg-[#7C69EF] text-white shadow-md shadow-purple-900/30 scale-105'
                  : 'bg-zinc-50 dark:bg-[#1f1638] text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/5 hover:bg-purple-50'
              }`}
            >
              <span className="text-[10px] opacity-75">{item.isToday ? 'Today' : ''}</span>
              <span className="text-xs font-bold font-mono">{item.dayNum}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Vertical Connected Timeline Rail (Screen 2 Timeline Layout) */}
      <div className="relative pl-6 space-y-6">
        {/* Continuous vertical timeline track line */}
        <div className="absolute left-[34px] top-4 bottom-4 w-0.5 bg-purple-200 dark:bg-purple-900/40" />

        {sortedHabits.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 text-center space-y-3 shadow-sm ml-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No Habits in Timeline</h3>
            <p className="text-xs text-zinc-500">
              Create your morning, afternoon, or evening habits to plot them on the chronological timeline.
            </p>
            <button
              type="button"
              onClick={onAddHabit}
              className="py-2.5 px-4 rounded-2xl bg-[#7C69EF] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Timeline Item</span>
            </button>
          </div>
        ) : (
          sortedHabits.map((habit, index) => {
            const comp = completionMap.get(habit.id);
            const isDone = comp?.status === 'COMPLETED';
            const timeLabel = habit.reminderTimes[0] || (habit.timeOfDay === 'MORNING' ? '08:00 AM' : habit.timeOfDay === 'AFTERNOON' ? '01:00 PM' : '08:00 PM');

            return (
              <div key={habit.id} className="relative flex items-start gap-4">
                {/* Node on vertical rail */}
                <div className="relative z-10 flex flex-col items-center mt-1">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                      : 'bg-white dark:bg-[#161026] border-purple-500 text-purple-600'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-purple-500" />}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 mt-1 whitespace-nowrap">
                    {timeLabel.toLowerCase()}
                  </span>
                </div>

                {/* Timeline Card */}
                <div className={`flex-1 p-4 rounded-3xl border transition-all shadow-sm ${
                  isDone
                    ? 'bg-purple-50/60 dark:bg-[#1a1230]/60 border-purple-200/60 dark:border-purple-900/40 opacity-80'
                    : 'bg-[#ECE8FD] dark:bg-[#1E1638] border-purple-300/40 dark:border-purple-800/40'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <SquircleIcon name={habit.icon} color={habit.color} size="md" variant={isDone ? 'soft' : 'solid'} />
                      <div>
                        <h4 className={`text-sm font-bold truncate max-w-[180px] ${isDone ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
                          {habit.name}
                        </h4>
                        <p className="text-xs text-purple-600 dark:text-purple-300 font-medium">
                          {habit.timeOfDay} • {habit.category || 'Habit'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleHabit(habit.id, selectedDate)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-[#7C69EF] text-white hover:bg-[#6c59db]'
                        }`}
                      >
                        {isDone ? 'Done' : 'Mark'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditHabit(habit)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
