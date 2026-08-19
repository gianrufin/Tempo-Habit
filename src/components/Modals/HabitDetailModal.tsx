import React from 'react';
import { Habit, HabitCompletion } from '../../types';
import { calculateStreak } from '../../domain/streakCalculator';
import { formatLocalDate, addDays } from '../../domain/recurrenceEngine';
import { X, Flame, Trophy, Calendar, Clock, Snowflake, PauseCircle, Edit3, Trash2 } from 'lucide-react';

interface HabitDetailModalProps {
  habit: Habit | null;
  completions: HabitCompletion[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onTogglePause: (habitId: string, days: number | null) => void;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  completions,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onTogglePause,
}) => {
  if (!isOpen || !habit) return null;

  const todayStr = formatLocalDate(new Date());
  const stats = calculateStreak(habit, completions, new Date());
  const habitCompletions = completions.filter(c => c.habitId === habit.id);
  const completionMap = new Map<string, string>();
  habitCompletions.forEach(c => completionMap.set(c.date, c.status));

  // Build 35-day (5 weeks) history grid
  const daysGrid: { dateStr: string; dayNum: number; status?: string; isToday: boolean }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const dateStr = formatLocalDate(d);
    daysGrid.push({
      dateStr,
      dayNum: d.getDate(),
      status: completionMap.get(dateStr),
      isToday: dateStr === todayStr,
    });
  }

  const isPaused = habit.pausedUntil && habit.pausedUntil >= todayStr;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[90vh] bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#18112b]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{habit.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-white leading-snug">{habit.name}</h2>
              <span className="text-xs text-zinc-400">Created on {habit.createdAt}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(habit)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Edit habit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this habit and all history?')) {
                  onDelete(habit.id);
                  onClose();
                }
              }}
              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
              title="Delete habit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#1b1330] rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Current</span>
              </div>
              <span className="text-xl font-bold text-amber-300">
                {stats.currentStreak} <span className="text-xs font-normal text-zinc-400">days</span>
              </span>
            </div>

            <div className="p-3 bg-[#1b1330] rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>Best Streak</span>
              </div>
              <span className="text-xl font-bold text-white">
                {stats.longestStreak} <span className="text-xs font-normal text-zinc-400">days</span>
              </span>
            </div>

            <div className="p-3 bg-[#1b1330] rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>30-Day Rate</span>
              </div>
              <span className="text-xl font-bold text-purple-300">
                {stats.completionRate30d}%
              </span>
            </div>

            <div className="p-3 bg-[#1b1330] rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                <span>Freezes Left</span>
              </div>
              <span className="text-xl font-bold text-sky-300">
                {stats.freezesRemainingThisWeek}/{habit.streakFreezeAllowance}
              </span>
            </div>
          </div>

          {/* 35-day Visual Heatmap */}
          <div className="p-4 bg-[#1b1330] rounded-2xl border border-purple-500/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Recent 35-Day Consistency Heatmap
              </span>
              <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-purple-600 to-amber-400" /> Done
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/50" /> Freeze
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0d0818]" /> Missed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {daysGrid.map(d => {
                const isCompleted = d.status === 'COMPLETED';
                const isFrozen = d.status === 'SKIPPED_EXCUSED';
                return (
                  <div
                    key={d.dateStr}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 text-[11px] font-semibold transition-transform hover:scale-110 ${
                      isCompleted
                        ? 'bg-gradient-to-tr from-purple-600 to-amber-400 text-white shadow-sm shadow-purple-900/50'
                        : isFrozen
                        ? 'bg-sky-500/30 text-sky-200 border border-sky-400/40'
                        : 'bg-[#0e081c] text-zinc-600 border border-white/5'
                    } ${d.isToday ? 'ring-2 ring-amber-400' : ''}`}
                    title={`${d.dateStr}: ${d.status || 'Pending / Missed'}`}
                  >
                    {d.dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI / Data Insights */}
          <div className="p-4 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-[#140e24] border border-purple-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Clock className="w-4 h-4" />
              <span>Optimal Execution Window</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Based on your completion logs, you are most consistent doing this habit during{' '}
              <strong className="text-white">{stats.bestTimeOfDay}</strong>.
            </p>
          </div>

          {/* Vacation Mode Controls */}
          <div className="p-4 bg-[#1b1330] rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <PauseCircle className="w-4 h-4 text-amber-400" />
                <span>Vacation / Pause Habit</span>
              </div>
              {isPaused && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Paused until {habit.pausedUntil}
                </span>
              )}
            </div>

            {isPaused ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Habit is currently paused.</span>
                <button
                  onClick={() => onTogglePause(habit.id, null)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                >
                  Resume Now
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-2">
                  Pause this habit if you are traveling or taking time off so your streak is safeguarded.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onTogglePause(habit.id, 3)}
                    className="flex-1 py-1.5 bg-[#0e081c] hover:bg-purple-900/40 text-xs font-medium text-zinc-300 rounded-xl border border-white/5"
                  >
                    Pause 3 days
                  </button>
                  <button
                    onClick={() => onTogglePause(habit.id, 7)}
                    className="flex-1 py-1.5 bg-[#0e081c] hover:bg-purple-900/40 text-xs font-medium text-zinc-300 rounded-xl border border-white/5"
                  >
                    Pause 1 week
                  </button>
                  <button
                    onClick={() => onTogglePause(habit.id, 14)}
                    className="flex-1 py-1.5 bg-[#0e081c] hover:bg-purple-900/40 text-xs font-medium text-zinc-300 rounded-xl border border-white/5"
                  >
                    Pause 2 weeks
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#18112b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
