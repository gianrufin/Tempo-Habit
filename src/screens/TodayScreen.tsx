import React, { useState } from 'react';
import {
  Flame,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  Plus,
  Edit2,
  Sparkles,
  ChevronRight,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Habit, HabitCompletion, Routine, Task, UserPreferences, TimeOfDay } from '../types';
import { sortHabitsAscending } from '../domain/habitSorter';
import { isHabitScheduledForDate } from '../domain/recurrenceEngine';
import { DayStrip } from '../components/DayStrip';
import { SquircleIcon } from '../components/SquircleIcon';

interface TodayScreenProps {
  selectedDate: string; // YYYY-MM-DD
  habits: Habit[];
  routines: Routine[];
  tasks: Task[];
  completions: HabitCompletion[];
  userPrefs: UserPreferences;
  onSelectDate: (date: string) => void;
  onToggleHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onEditRoutine: (routine: Routine) => void;
  onAddHabit: () => void;
  onAddRoutine: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  selectedDate,
  habits,
  routines,
  tasks,
  completions,
  userPrefs,
  onSelectDate,
  onToggleHabit,
  onEditHabit,
  onEditRoutine,
  onAddHabit,
  onAddRoutine,
}) => {
  const [filter, setFilter] = useState<'ALL' | TimeOfDay | 'ROUTINES'>('ALL');

  // Filter scheduled habits for the selected date
  const scheduledHabits = habits.filter(h => isHabitScheduledForDate(h, selectedDate));
  const sortedHabits = sortHabitsAscending(scheduledHabits);

  // Filter by time of day or routines
  const displayedHabits = sortedHabits.filter(h => {
    if (filter === 'ALL') return true;
    if (filter === 'ROUTINES') return !!h.routineId;
    return h.timeOfDay === filter;
  });

  const completionMap = new Map<string, HabitCompletion>();
  completions.forEach(c => {
    if (c.date === selectedDate) {
      completionMap.set(c.habitId, c);
    }
  });

  const completedCount = scheduledHabits.filter(h => completionMap.get(h.id)?.status === 'COMPLETED').length;
  const streakCount = completedCount > 0 ? 1 : 0;

  // Find next upcoming uncompleted habit
  const nextUncompletedHabit = sortedHabits.find(h => completionMap.get(h.id)?.status !== 'COMPLETED');

  const getDayLetter = (dayIndex: number) => ['M', 'T', 'W', 'T', 'F', 'S', 'S'][dayIndex - 1];

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-5 animate-fade-in">
      {/* 1. Days Logged In Row (Attached Design Top Strip) */}
      <div className="bg-white dark:bg-[#161026] p-4 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
        <DayStrip
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          streakCount={streakCount}
        />
      </div>

      {/* 2. Hero Tangerine Streak Card (Attached Design Hero) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFA048] via-[#FF8522] to-[#FF6B00] p-5 sm:p-6 text-white shadow-lg shadow-orange-950/20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 shadow-sm shrink-0">
              <Sun className="w-6 h-6" strokeWidth={2.4} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Daily Momentum
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5">
                <Flame className="w-6 h-6 fill-white text-white" />
                <span>{streakCount > 0 ? `${streakCount} Day Streak` : 'Start Streak'}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddHabit}
            className="px-3.5 py-2 rounded-2xl bg-white text-[#FF6B00] font-bold text-xs shadow-md hover:bg-orange-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* 3. Horizontal Filter Pills (Attached Design Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'MORNING', label: 'Morning' },
          { key: 'AFTERNOON', label: 'Afternoon' },
          { key: 'EVENING', label: 'Evening' },
          { key: 'NIGHT', label: 'Night' },
          { key: 'ROUTINES', label: 'Routines' },
        ].map(pill => {
          const isActive = filter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => setFilter(pill.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7C69EF] text-white shadow-sm shadow-purple-900/20'
                  : 'bg-white dark:bg-[#161026] text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* 4. Next Upcoming Habit / Highlight Card (Attached Design Next Alarm Card) */}
      {nextUncompletedHabit ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#ECE8FD] dark:bg-[#1E1638] border border-purple-300/60 dark:border-purple-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <SquircleIcon name={nextUncompletedHabit.icon} color={nextUncompletedHabit.color} size="lg" variant="solid" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Your Next Habit
              </span>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
                {nextUncompletedHabit.name}
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-mono font-medium">
                {nextUncompletedHabit.reminderTimes[0] || '8:00 AM'} • {nextUncompletedHabit.timeOfDay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleHabit(nextUncompletedHabit.id)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete</span>
            </button>
            <button
              type="button"
              onClick={() => onEditHabit(nextUncompletedHabit)}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#2b1f4f] text-zinc-700 dark:text-zinc-200 border border-purple-300/40 font-medium text-xs hover:bg-purple-50 transition-colors"
              title="Edit Habit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : scheduledHabits.length === 0 ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Start from Scratch</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-1">
              Add your first daily habit, morning routine, or focus goal to build your custom schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddHabit}
            className="py-2.5 px-5 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-purple-900/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Habit</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">All Done for Today!</h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">You completed all {scheduledHabits.length} habits.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">100%</span>
        </div>
      )}

      {/* 5. Quick Stats Bento Row (Attached Design Stats Cards) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Habits Active
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {scheduledHabits.length}
            </span>
            <span className="text-xs text-zinc-400">total</span>
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            {completedCount} completed today
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Routines
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-zinc-900 dark:text-white">
                {routines.length}
              </span>
              <span className="text-xs text-zinc-400">flows</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">Morning &amp; Evening</p>
          </div>

          <button
            type="button"
            onClick={onAddRoutine}
            className="w-10 h-10 rounded-2xl bg-[#1e1538] dark:bg-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
            title="Create Routine"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 6. Habits List in Chronological Order (Attached Design Alarm/Habit Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Today&apos;s Schedule (Ascending Order)
          </h3>
          <span className="text-xs text-zinc-400">
            {displayedHabits.length} {displayedHabits.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {displayedHabits.map(habit => {
          const comp = completionMap.get(habit.id);
          const isDone = comp?.status === 'COMPLETED';
          const timeLabel = habit.reminderTimes[0] || (habit.timeOfDay === 'MORNING' ? '08:00 AM' : habit.timeOfDay === 'AFTERNOON' ? '01:00 PM' : '08:00 PM');

          return (
            <div
              key={habit.id}
              className={`p-4 rounded-3xl border transition-all shadow-sm flex flex-col gap-3 ${
                isDone
                  ? 'bg-purple-50/60 dark:bg-[#1b1333]/60 border-purple-300/40 dark:border-purple-900/40 opacity-80'
                  : 'bg-white dark:bg-[#161026] border-black/5 dark:border-white/5 hover:border-purple-400/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <SquircleIcon name={habit.icon} color={habit.color} size="md" variant={isDone ? 'soft' : 'solid'} />
                  <div>
                    <h4 className={`text-sm font-bold truncate max-w-[200px] ${isDone ? 'line-through text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>
                      {habit.name}
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono">
                      {timeLabel} • {habit.category || habit.timeOfDay}
                    </p>
                  </div>
                </div>

                {/* Complete Toggle Switch */}
                <button
                  type="button"
                  onClick={() => onToggleHabit(habit.id)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                    isDone ? 'bg-[#7C69EF] justify-end' : 'bg-zinc-200 dark:bg-zinc-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                    {isDone && <CheckCircle2 className="w-3 h-3 text-[#7C69EF]" />}
                  </div>
                </button>
              </div>

              {/* Weekday Chips row matching screenshot */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[10px]">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <span
                      key={day}
                      className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-400"
                    >
                      {getDayLetter(day)}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onEditHabit(habit)}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
