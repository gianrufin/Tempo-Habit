import React, { useState } from 'react';
import { Habit, HabitCompletion, MoodRecord, HabitCompletionStatus } from '../types';
import { formatLocalDate, isEligibleOn } from '../domain/recurrenceEngine';
import { sortHabitsAscending } from '../domain/habitSorter';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Flame, Sparkles } from 'lucide-react';

interface CalendarScreenProps {
  habits: Habit[];
  completions: HabitCompletion[];
  moods: MoodRecord[];
  onToggleHabitStatus: (habitId: string, date: string, newStatus: HabitCompletionStatus | null) => void;
  onOpenHabitDetail: (habit: Habit) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  habits,
  completions,
  moods,
  onToggleHabitStatus,
  onOpenHabitDetail,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(formatLocalDate(new Date()));
  const [filterHabitId, setFilterHabitId] = useState<string>('ALL');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // 1 = Monday, 0 = Sunday -> Normalize so Monday is col 0, Sunday is col 6
  let startCol = firstDayOfMonth.getDay() - 1;
  if (startCol < 0) startCol = 6;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(formatLocalDate(today));
  };

  // Build calendar cells
  const calendarCells = [];
  // Leading empty cells
  for (let i = 0; i < startCol; i++) {
    calendarCells.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, month, d);
    const dateStr = formatLocalDate(dObj);
    calendarCells.push({
      dayNum: d,
      dateStr,
      dateObj: dObj,
    });
  }

  // Pre-index completions for fast access
  const completionMap = new Map<string, HabitCompletion[]>();
  completions.forEach(c => {
    if (!completionMap.has(c.date)) {
      completionMap.set(c.date, []);
    }
    completionMap.get(c.date)!.push(c);
  });

  const moodMap = new Map<string, MoodRecord>();
  moods.forEach(m => moodMap.set(m.date, m));

  // Calculate day stats
  const getDayStats = (dateStr: string, dateObj: Date) => {
    const dayCompletions = completionMap.get(dateStr) || [];
    const targetHabits = filterHabitId === 'ALL'
      ? habits.filter(h => isEligibleOn(h.recurrenceRule, dateObj, h.createdAt))
      : habits.filter(h => h.id === filterHabitId && isEligibleOn(h.recurrenceRule, dateObj, h.createdAt));

    const totalEligible = targetHabits.length;
    const completedCount = dayCompletions.filter(c => {
      if (filterHabitId !== 'ALL' && c.habitId !== filterHabitId) return false;
      return c.status === 'COMPLETED';
    }).length;

    const rate = totalEligible > 0 ? completedCount / totalEligible : 0;
    return { completedCount, totalEligible, rate };
  };

  // Sorted list of habits
  const sortedHabits = sortHabitsAscending(habits);

  // Details for the selected day, sorted ascending morning to evening
  const selectedDayObj = new Date(selectedDayStr + 'T00:00:00');
  const selectedDayEligibleHabits = sortHabitsAscending(
    habits.filter(h => isEligibleOn(h.recurrenceRule, selectedDayObj, h.createdAt))
  );
  const selectedDayCompletions = completionMap.get(selectedDayStr) || [];
  const selectedDayMood = moodMap.get(selectedDayStr);

  const moodEmojis: Record<number, string> = {
    1: '😫',
    2: '🙁',
    3: '😐',
    4: '🙂',
    5: '✨',
  };

  return (
    <div className="pb-28 px-4 sm:px-6 pt-4 max-w-4xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            Calendar Matrix
          </h2>
          <p className="text-xs text-zinc-400">Monthly overview & historical completions</p>
        </div>

        {/* Filter by specific habit */}
        <div className="flex items-center gap-2">
          <select
            value={filterHabitId}
            onChange={e => setFilterHabitId(e.target.value)}
            className="bg-[#18112c] text-xs text-zinc-200 font-medium px-3 py-2 rounded-xl border border-purple-500/25 focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            <option value="ALL">All Habits Combined</option>
            {sortedHabits.map(h => (
              <option key={h.id} value={h.id}>
                {h.icon} {h.name}
              </option>
            ))}
          </select>

          <button
            onClick={goToday}
            className="px-3 py-2 bg-[#18112c] hover:bg-purple-900/30 text-amber-300 text-xs font-bold rounded-xl border border-purple-500/20 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between p-3.5 bg-[#140e24] border border-purple-500/20 rounded-2xl mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold text-white tracking-tight">
          {monthName} <span className="text-amber-400">{year}</span>
        </h3>

        <button
          onClick={nextMonth}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-transparent" />;
          }

          const { dayNum, dateStr, dateObj } = cell;
          const { completedCount, totalEligible, rate } = getDayStats(dateStr, dateObj);
          const isSelected = dateStr === selectedDayStr;
          const isToday = dateStr === formatLocalDate(new Date());
          const mood = moodMap.get(dateStr);

          // Determine intensity color
          let bgClass = 'bg-[#150f24] hover:bg-[#1f1538] border-white/5 text-zinc-300';
          if (totalEligible > 0 && rate > 0) {
            if (rate === 1) {
              bgClass = 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 text-emerald-200';
            } else if (rate >= 0.5) {
              bgClass = 'bg-purple-950/50 hover:bg-purple-900/60 border-purple-500/40 text-purple-200';
            } else {
              bgClass = 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/30 text-amber-200';
            }
          }

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDayStr(dateStr)}
              className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between text-left transition-all ${bgClass} ${
                isSelected ? 'ring-2 ring-amber-400 shadow-lg shadow-purple-950/50 scale-[1.02]' : ''
              } ${isToday ? 'border-amber-400/60' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-bold ${
                    isToday ? 'px-1.5 py-0.5 bg-amber-400 text-zinc-950 rounded-md' : 'text-zinc-300'
                  }`}
                >
                  {dayNum}
                </span>
                {mood && <span className="text-xs">{moodEmojis[mood.mood] || '✨'}</span>}
              </div>

              {/* Progress Indicator */}
              {totalEligible > 0 ? (
                <div className="w-full">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-zinc-400 font-mono mb-1">
                    <span>
                      {completedCount}/{totalEligible}
                    </span>
                    {rate === 1 && <Sparkles className="w-2.5 h-2.5 text-amber-300" />}
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        rate === 1 ? 'bg-emerald-400' : rate >= 0.5 ? 'bg-purple-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(rate * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[9px] text-zinc-600 font-mono">Rest</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Details Panel */}
      <div className="p-4 sm:p-5 bg-[#140e24] border border-purple-500/20 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Habits for {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>
          {selectedDayMood && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-950/60 border border-purple-500/30 rounded-full text-xs text-amber-300">
              <span>{moodEmojis[selectedDayMood.mood]}</span>
              <span className="font-semibold">Mood logged</span>
            </div>
          )}
        </div>

        {selectedDayEligibleHabits.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No habits were scheduled for this date.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedDayEligibleHabits.map(habit => {
              const comp = selectedDayCompletions.find(c => c.habitId === habit.id);
              const isCompleted = comp?.status === 'COMPLETED';
              const isFrozen = comp?.status === 'SKIPPED_EXCUSED';

              return (
                <div
                  key={habit.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                    isCompleted
                      ? 'bg-[#18112c] border-emerald-500/30'
                      : isFrozen
                      ? 'bg-[#18112c] border-sky-500/30'
                      : 'bg-[#18112c]/60 border-white/5'
                  }`}
                >
                  <div
                    onClick={() => onOpenHabitDetail(habit)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 mr-2"
                  >
                    <span className="text-xl">{habit.icon}</span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{habit.name}</p>
                      <p className="text-[10px] text-zinc-400">{habit.category || habit.timeOfDay}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        onToggleHabitStatus(habit.id, selectedDayStr, isCompleted ? null : 'COMPLETED')
                      }
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                          : 'bg-[#22173d] text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Done' : 'Mark'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
