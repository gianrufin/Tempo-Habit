import React, { useState } from 'react';
import { Habit, HabitCompletion, Routine, MoodRecord, HabitCompletionStatus, MoodValue } from '../types';
import { DayStrip } from '../components/DayStrip';
import { MoodPicker } from '../components/MoodPicker';
import { HabitCard } from '../components/HabitCard';
import { RoutineCard } from '../components/RoutineCard';
import { isEligibleOn, formatLocalDate } from '../domain/recurrenceEngine';
import { sortHabitsAscending, sortRoutinesAscending } from '../domain/habitSorter';
import { Plus, Sparkles, Layers, ListPlus, ArrowDownUp } from 'lucide-react';

interface TodayScreenProps {
  habits: Habit[];
  routines: Routine[];
  completions: HabitCompletion[];
  moods: MoodRecord[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleHabitStatus: (habitId: string, date: string, newStatus: HabitCompletionStatus | null) => void;
  onSaveMood: (mood: MoodValue, note?: string) => void;
  onOpenHabitDetail: (habit: Habit) => void;
  onOpenAddHabit: () => void;
  onOpenAddRoutine: () => void;
  onOpenQuickAdd: () => void;
  onAddHabitToRoutine: (routineId: string) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  habits,
  routines,
  completions,
  moods,
  selectedDate,
  onSelectDate,
  onToggleHabitStatus,
  onSaveMood,
  onOpenHabitDetail,
  onOpenAddHabit,
  onOpenAddRoutine,
  onOpenQuickAdd,
  onAddHabitToRoutine,
}) => {
  const [showFabMenu, setShowFabMenu] = useState(false);

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const currentMood = moods.find(m => m.date === selectedDate);

  // Eligible habits for the selected date, sorted ascending morning to evening
  const eligibleHabits = sortHabitsAscending(
    habits.filter(h => isEligibleOn(h.recurrenceRule, selectedDateObj, h.createdAt))
  );

  // Routines sorted ascending morning to evening
  const sortedRoutines = sortRoutinesAscending(routines);

  // Identify habits inside routines vs standalone
  const routineHabitIds = new Set<string>();
  routines.forEach(r => r.habitIds.forEach(id => routineHabitIds.add(id)));

  const standaloneHabits = eligibleHabits.filter(h => !routineHabitIds.has(h.id));

  return (
    <div className="pb-28">
      {/* Day strip horizontal calendar */}
      <DayStrip
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        habits={habits}
        completions={completions}
      />

      {/* Mood Picker */}
      <MoodPicker
        selectedDate={selectedDate}
        currentMood={currentMood}
        onSaveMood={onSaveMood}
      />

      {/* Routines Section */}
      {sortedRoutines.length > 0 && (
        <div className="mt-2">
          {sortedRoutines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              habits={eligibleHabits}
              completions={completions}
              selectedDate={selectedDate}
              onToggleHabitStatus={onToggleHabitStatus}
              onOpenHabitDetail={onOpenHabitDetail}
              onAddHabitToRoutine={onAddHabitToRoutine}
            />
          ))}
        </div>
      )}

      {/* Standalone Habits Section */}
      <div className="mx-4 sm:mx-6 mt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              {sortedRoutines.length > 0 ? 'Individual Habits' : 'Daily Habits'} ({standaloneHabits.length})
            </span>
            <span className="text-[10px] text-purple-300/70 flex items-center gap-0.5 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/20" title="Ordered ascending by time: Morning to Evening">
              <ArrowDownUp className="w-2.5 h-2.5 text-amber-400" />
              <span>Morning → Evening</span>
            </span>
          </div>
          <button
            onClick={onOpenQuickAdd}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Template ideas
          </button>
        </div>

        {standaloneHabits.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-[#140e24] border border-dashed border-purple-500/20">
            <p className="text-sm font-semibold text-zinc-300">No standalone habits scheduled for today</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Create a custom habit or select one from curated templates.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={onOpenQuickAdd}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Explore Templates
              </button>
              <button
                onClick={onOpenAddHabit}
                className="px-4 py-2 bg-[#1b1330] hover:bg-[#251a42] text-zinc-200 text-xs font-semibold rounded-xl border border-white/10"
              >
                Custom Habit
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {standaloneHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completions={completions}
                selectedDate={selectedDate}
                onToggleStatus={onToggleHabitStatus}
                onOpenDetail={onOpenHabitDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Speed Dial / Quick Add Button */}
      <div className="fixed bottom-24 right-6 z-40">
        {showFabMenu && (
          <div className="mb-3 flex flex-col gap-2 items-end animate-fade-in">
            <button
              onClick={() => {
                setShowFabMenu(false);
                onOpenQuickAdd();
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1c1333] hover:bg-[#271b47] text-amber-300 border border-amber-400/30 rounded-full shadow-xl text-xs font-bold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Template</span>
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                onOpenAddRoutine();
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1c1333] hover:bg-[#271b47] text-purple-300 border border-purple-400/30 rounded-full shadow-xl text-xs font-bold transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>New Routine</span>
            </button>

            <button
              onClick={() => {
                setShowFabMenu(false);
                onOpenAddHabit();
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1c1333] hover:bg-[#271b47] text-white border border-purple-400/30 rounded-full shadow-xl text-xs font-bold transition-all"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>New Habit</span>
            </button>
          </div>
        )}

        <button
          id="fab-main-button"
          onClick={() => setShowFabMenu(!showFabMenu)}
          aria-label="Add habit or routine"
          className={`w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-amber-400 p-[1.5px] shadow-xl shadow-purple-900/60 transition-transform ${
            showFabMenu ? 'rotate-45' : 'hover:scale-105'
          }`}
        >
          <div className="w-full h-full bg-[#0d071a] rounded-[14px] flex items-center justify-center">
            <Plus className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
        </button>
      </div>
    </div>
  );
};
