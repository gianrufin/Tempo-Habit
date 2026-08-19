import React from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { formatLocalDate, addDays } from '../domain/recurrenceEngine';

interface DayStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  streakCount: number;
}

export const DayStrip: React.FC<DayStripProps> = ({
  selectedDate,
  onSelectDate,
  streakCount,
}) => {
  const today = new Date();
  const todayStr = formatLocalDate(today);

  // Generate 7-day logged in cycle (days around today)
  const days = [-2, -1, 0, 1, 2, 3, 4].map(offset => {
    const d = addDays(today, offset);
    const dateStr = formatLocalDate(d);
    const dayNum = d.getDate();
    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isSelected = dateStr === selectedDate;
    const isFuture = dateStr > todayStr;

    let label = `Day ${dayNum}`;
    if (isToday) label = 'Today';

    return {
      dateStr,
      dayNum,
      label,
      isToday,
      isPast,
      isSelected,
      isFuture,
    };
  });

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Days Logged In
        </span>
        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {streakCount > 0 ? `${streakCount} Day Streak` : 'Start Streak Today'}
        </span>
      </div>

      {/* Horizontal Day Bubbles from Screenshot */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {days.map((item, idx) => {
          if (item.isToday) {
            return (
              <button
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex-1 min-w-[50px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  item.isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30 scale-105'
                    : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-2 border-purple-400/60'
                }`}
              >
                <span className="text-[10px] font-bold tracking-tight">Today</span>
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-current flex items-center justify-center animate-pulse">
                  <span className="text-[11px] font-bold">{item.dayNum}</span>
                </div>
              </button>
            );
          }

          if (item.isPast) {
            return (
              <button
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex-1 min-w-[46px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  item.isSelected
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-[#1b142f] text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
              >
                <span className="text-[10px] text-zinc-400 font-medium">{item.label}</span>
                <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.dateStr}
              onClick={() => onSelectDate(item.dateStr)}
              className={`flex-1 min-w-[46px] py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                item.isSelected
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#1b142f] text-zinc-400 dark:text-zinc-500 border border-black/5 dark:border-white/5 opacity-70'
              }`}
            >
              <span className="text-[10px] font-medium">{item.label}</span>
              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Lock className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
