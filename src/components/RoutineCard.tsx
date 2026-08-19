import React, { useState } from 'react';
import { Routine, Habit, HabitCompletion, HabitCompletionStatus } from '../types';
import { HabitCard } from './HabitCard';
import { sortHabitsAscending } from '../domain/habitSorter';
import { ChevronDown, ChevronUp, Sun, Moon, Sunrise, Sunset, Clock, Plus } from 'lucide-react';

interface RoutineCardProps {
  routine: Routine;
  habits: Habit[];
  completions: HabitCompletion[];
  selectedDate: string;
  onToggleHabitStatus: (habitId: string, date: string, newStatus: HabitCompletionStatus | null) => void;
  onOpenHabitDetail: (habit: Habit) => void;
  onAddHabitToRoutine: (routineId: string) => void;
}

export const RoutineCard: React.FC<RoutineCardProps> = ({
  routine,
  habits,
  completions,
  selectedDate,
  onToggleHabitStatus,
  onOpenHabitDetail,
  onAddHabitToRoutine,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const routineHabits = sortHabitsAscending(habits.filter(h => routine.habitIds.includes(h.id)));
  
  const completedCount = routineHabits.filter(h => {
    return completions.some(c => c.habitId === h.id && c.date === selectedDate && c.status === 'COMPLETED');
  }).length;

  const totalCount = routineHabits.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  const getTimeIcon = () => {
    switch (routine.timeOfDay) {
      case 'MORNING':
        return <Sunrise className="w-4 h-4 text-amber-400" />;
      case 'AFTERNOON':
        return <Sun className="w-4 h-4 text-orange-400" />;
      case 'EVENING':
        return <Sunset className="w-4 h-4 text-purple-400" />;
      case 'NIGHT':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="mx-4 sm:mx-6 my-3 rounded-2xl bg-[#120c22] border border-purple-500/20 overflow-hidden shadow-lg shadow-purple-950/20">
      {/* Routine Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-lg">
            {routine.icon || '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">{routine.name}</h3>
              {isAllDone && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  All done
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1">
                {getTimeIcon()}
                {routine.timeOfDay.toLowerCase()}
              </span>
              <span>•</span>
              <span className="font-medium text-amber-300">
                {completedCount}/{totalCount} completed
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress bar pill */}
          <div className="w-16 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAllDone
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-purple-500 to-amber-400'
              }`}
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>

          <button className="p-1 text-zinc-400 hover:text-white">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Routine Habits list */}
      {isOpen && (
        <div className="p-3 pt-0 flex flex-col gap-2 border-t border-white/5 bg-black/20">
          {routineHabits.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400">
              <p>No habits in this routine yet.</p>
              <button
                onClick={() => onAddHabitToRoutine(routine.id)}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-full text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add a habit
              </button>
            </div>
          ) : (
            routineHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completions={completions}
                selectedDate={selectedDate}
                onToggleStatus={onToggleHabitStatus}
                onOpenDetail={onOpenHabitDetail}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
