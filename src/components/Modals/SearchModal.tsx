import React, { useState, useEffect, useRef } from 'react';
import { Habit, Task, Routine, Goal } from '../../types';
import { Search, X, Sparkles, CheckSquare, Layers, Target, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  tasks: Task[];
  routines: Routine[];
  goals: Goal[];
  onSelectHabit: (habit: Habit) => void;
  onSelectTask: (task: Task) => void;
  onSelectRoutine: (routine: Routine) => void;
  onSelectGoal: (goal: Goal) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  habits,
  tasks,
  routines,
  goals,
  onSelectHabit,
  onSelectTask,
  onSelectRoutine,
  onSelectGoal,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const matchingHabits = cleanQuery
    ? habits.filter(
        h =>
          h.name.toLowerCase().includes(cleanQuery) ||
          h.category?.toLowerCase().includes(cleanQuery) ||
          h.timeOfDay.toLowerCase().includes(cleanQuery)
      )
    : [];

  const matchingTasks = cleanQuery
    ? tasks.filter(
        t =>
          t.title.toLowerCase().includes(cleanQuery) ||
          t.notes?.toLowerCase().includes(cleanQuery) ||
          t.checklist.some(c => c.label.toLowerCase().includes(cleanQuery))
      )
    : [];

  const matchingRoutines = cleanQuery
    ? routines.filter(r => r.name.toLowerCase().includes(cleanQuery))
    : [];

  const matchingGoals = cleanQuery
    ? goals.filter(
        g =>
          g.title.toLowerCase().includes(cleanQuery) ||
          g.rewardNote?.toLowerCase().includes(cleanQuery)
      )
    : [];

  const totalMatches =
    matchingHabits.length + matchingTasks.length + matchingRoutines.length + matchingGoals.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 bg-[#18112b] flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search habits, tasks, routines, or milestones..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-white/5 rounded-lg"
          >
            Esc
          </button>
        </div>

        {/* Search Results */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {!cleanQuery ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              Type keywords to search across all your routines, habits, and tasks.
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No matches found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* Habits */}
              {matchingHabits.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Habits ({matchingHabits.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingHabits.map(h => (
                      <div
                        key={h.id}
                        onClick={() => {
                          onSelectHabit(h);
                          onClose();
                        }}
                        className="p-2.5 bg-[#1a1230] hover:bg-[#251b44] rounded-xl flex items-center justify-between cursor-pointer border border-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{h.icon}</span>
                          <div>
                            <p className="text-xs font-semibold text-white">{h.name}</p>
                            <p className="text-[10px] text-zinc-400">
                              {h.category || 'General'} • {h.timeOfDay}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {matchingTasks.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                    Tasks ({matchingTasks.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        className="p-2.5 bg-[#1a1230] hover:bg-[#251b44] rounded-xl flex items-center justify-between cursor-pointer border border-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckSquare
                            className={`w-4 h-4 ${t.completed ? 'text-emerald-400' : 'text-zinc-500'}`}
                          />
                          <div>
                            <p
                              className={`text-xs font-semibold ${
                                t.completed ? 'line-through text-zinc-500' : 'text-white'
                              }`}
                            >
                              {t.title}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              Priority: {t.priority} {t.dueDate ? `• Due ${t.dueDate}` : ''}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Routines */}
              {matchingRoutines.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Routines ({matchingRoutines.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingRoutines.map(r => (
                      <div
                        key={r.id}
                        onClick={() => {
                          onSelectRoutine(r);
                          onClose();
                        }}
                        className="p-2.5 bg-[#1a1230] hover:bg-[#251b44] rounded-xl flex items-center justify-between cursor-pointer border border-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{r.icon}</span>
                          <div>
                            <p className="text-xs font-semibold text-white">{r.name}</p>
                            <p className="text-[10px] text-zinc-400">
                              {r.habitIds.length} habits • {r.timeOfDay}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {matchingGoals.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Milestones ({matchingGoals.length})
                  </h4>
                  <div className="space-y-1.5">
                    {matchingGoals.map(g => (
                      <div
                        key={g.id}
                        onClick={() => {
                          onSelectGoal(g);
                          onClose();
                        }}
                        className="p-2.5 bg-[#1a1230] hover:bg-[#251b44] rounded-xl flex items-center justify-between cursor-pointer border border-white/5 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{g.title}</p>
                          <p className="text-[10px] text-zinc-400">
                            Target: {g.targetCompletions} completions
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
