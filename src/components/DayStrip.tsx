import React, { useRef, useEffect } from 'react';
import { formatLocalDate, addDays } from '../domain/recurrenceEngine';
import { Habit, HabitCompletion } from '../types';

interface DayStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  habits: Habit[];
  completions: HabitCompletion[];
}

export const DayStrip: React.FC<DayStripProps> = ({
  selectedDate,
  onSelectDate,
  habits,
  completions,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const todayStr = formatLocalDate(new Date());

  // Generate a window of 14 days centered around today/selectedDate
  const days = React.useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const baseDate = new Date();
    for (let i = -7; i <= 7; i++) {
      const d = addDays(baseDate, i);
      const dateStr = formatLocalDate(d);
      list.push({
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
      });
    }
    return list;
  }, [todayStr]);

  // Center the selected day in view
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate]);

  // Calculate completion percentage for a given date
  const getCompletionFraction = (dateStr: string) => {
    const dayCompletions = completions.filter(c => c.date === dateStr && c.status === 'COMPLETED');
    if (habits.length === 0) return 0;
    return Math.min(1, dayCompletions.length / habits.length);
  };

  return (
    <div className="w-full py-2">
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 py-1"
      >
        {days.map(d => {
          const isSelected = d.dateStr === selectedDate;
          const fraction = getCompletionFraction(d.dateStr);

          return (
            <button
              key={d.dateStr}
              data-active={isSelected}
              id={`day-pill-${d.dateStr}`}
              onClick={() => onSelectDate(d.dateStr)}
              className={`flex-shrink-0 flex flex-col items-center justify-between w-12 h-16 py-2 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-b from-purple-600 to-amber-500 text-white font-bold shadow-lg shadow-purple-900/40 scale-105'
                  : 'bg-[#150f24] hover:bg-[#1f1636] text-zinc-400 border border-purple-500/10'
              }`}
            >
              <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-amber-100' : 'text-zinc-500'}`}>
                {d.dayName}
              </span>
              <span className="text-base font-bold">
                {d.dayNum}
              </span>
              
              {/* Mini progress bar indicator */}
              <div className="w-6 h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isSelected ? 'bg-white' : 'bg-gradient-to-r from-purple-400 to-amber-400'}`}
                  style={{ width: `${fraction * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
