import React from 'react';
import { Habit, HabitCompletion, HabitCompletionStatus } from '../types';
import { calculateStreak } from '../domain/streakCalculator';
import { formatRecurrenceRule } from '../domain/recurrenceEngine';
import { Check, Flame, Snowflake, Clock, PauseCircle, ChevronRight } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  completions: HabitCompletion[];
  selectedDate: string; // YYYY-MM-DD
  onToggleStatus: (habitId: string, date: string, newStatus: HabitCompletionStatus | null) => void;
  onOpenDetail: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  completions,
  selectedDate,
  onToggleStatus,
  onOpenDetail,
}) => {
  const completion = completions.find(c => c.habitId === habit.id && c.date === selectedDate);
  const status: HabitCompletionStatus | 'PENDING' = completion?.status || 'PENDING';

  const stats = calculateStreak(habit, completions, new Date(selectedDate + 'T00:00:00'));

  const isCompleted = status === 'COMPLETED';
  const isFrozen = status === 'SKIPPED_EXCUSED';
  const isPaused = habit.pausedUntil && habit.pausedUntil >= selectedDate;

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) {
      onToggleStatus(habit.id, selectedDate, null);
    } else {
      onToggleStatus(habit.id, selectedDate, 'COMPLETED');
    }
  };

  const handleFreezeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFrozen) {
      onToggleStatus(habit.id, selectedDate, null);
    } else {
      onToggleStatus(habit.id, selectedDate, 'SKIPPED_EXCUSED');
    }
  };

  return (
    <div
      id={`habit-card-${habit.id}`}
      onClick={() => onOpenDetail(habit)}
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isCompleted
          ? 'bg-[#181129]/90 border-purple-500/30 text-zinc-100 shadow-sm shadow-purple-900/20'
          : isFrozen
          ? 'bg-[#0f172a]/90 border-sky-500/30 text-sky-100'
          : isPaused
          ? 'bg-[#1a1523]/60 border-zinc-700/30 text-zinc-400 opacity-75'
          : 'bg-[#140e24] hover:bg-[#1a1330] border-purple-500/15 text-zinc-200 hover:border-purple-500/30'
      }`}
    >
      {/* Left side: Check button & Habit Info */}
      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
        {/* Animated Custom Checkbox */}
        <button
          type="button"
          onClick={handleCheckClick}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            isCompleted
              ? 'bg-gradient-to-tr from-purple-600 to-amber-400 text-white shadow-md shadow-amber-500/20 scale-105 ring-2 ring-amber-400/40'
              : isFrozen
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
              : 'bg-[#0f091c] border-2 border-zinc-600 hover:border-amber-400 text-transparent hover:text-amber-400/40'
          }`}
        >
          {isCompleted ? (
            <Check className="w-5 h-5 stroke-[2.5]" />
          ) : isFrozen ? (
            <Snowflake className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
          )}
        </button>

        {/* Habit Icon & Text */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl flex-shrink-0">{habit.icon}</span>
            <span
              className={`text-sm sm:text-base font-semibold truncate ${
                isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'
              }`}
            >
              {habit.name}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
            {/* Recurrence rule */}
            <span className="truncate">{formatRecurrenceRule(habit.recurrenceRule)}</span>

            {/* Vacation tag if paused */}
            {isPaused && (
              <span className="flex items-center gap-1 text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700">
                <PauseCircle className="w-3 h-3 text-amber-400" />
                Paused
              </span>
            )}

            {/* Reminder time */}
            {habit.reminderTimes && habit.reminderTimes.length > 0 && (
              <span className="hidden sm:flex items-center gap-0.5 text-zinc-500">
                <Clock className="w-3 h-3" />
                {habit.reminderTimes[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Streak Badge, Freeze Button & Chevron */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
        {/* Streak Counter */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            stats.currentStreak > 0
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-zinc-800/40 text-zinc-400 border border-zinc-700/30'
          }`}
          title={`Current streak: ${stats.currentStreak} days (Best: ${stats.longestStreak} days)`}
        >
          <Flame
            className={`w-3.5 h-3.5 ${
              stats.currentStreak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-zinc-500'
            }`}
          />
          <span>{stats.currentStreak}</span>
        </div>

        {/* Freeze / Excused toggle button */}
        {!isCompleted && !isPaused && (
          <button
            type="button"
            onClick={handleFreezeClick}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isFrozen
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/50'
                : 'bg-white/5 hover:bg-sky-500/20 text-zinc-400 hover:text-sky-300'
            }`}
            title={isFrozen ? 'Unfreeze' : `Use streak freeze (${stats.freezesRemainingThisWeek} left this week)`}
          >
            <Snowflake className="w-3.5 h-3.5" />
          </button>
        )}

        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </div>
    </div>
  );
};
