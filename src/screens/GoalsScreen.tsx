import React from 'react';
import { Goal, Habit, HabitCompletion } from '../types';
import { Target, Plus, Trophy, Award, Gift, Sparkles, CheckCircle2, Trash2, Edit3 } from 'lucide-react';
import { playCelebrationSound } from '../audio/soundPlayer';

interface GoalsScreenProps {
  goals: Goal[];
  habits: Habit[];
  completions: HabitCompletion[];
  onOpenAddGoal: () => void;
  onOpenEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onOpenHabitDetail: (habit: Habit) => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  habits,
  completions,
  onOpenAddGoal,
  onOpenEditGoal,
  onDeleteGoal,
  onOpenHabitDetail,
}) => {
  const getGoalProgress = (goal: Goal) => {
    const habitCompletions = completions.filter(
      c => c.habitId === goal.linkedHabitId && c.status === 'COMPLETED'
    );
    const count = habitCompletions.length;
    const percent = Math.min(Math.round((count / goal.targetCompletions) * 100), 100);
    const isCompleted = count >= goal.targetCompletions;
    return { count, percent, isCompleted };
  };

  return (
    <div className="pb-28 px-4 sm:px-6 pt-4 max-w-3xl mx-auto space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Milestones & Commitments
          </h2>
          <p className="text-xs text-zinc-400">Long-term targets with celebratory rewards</p>
        </div>

        <button
          onClick={onOpenAddGoal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Milestone</span>
        </button>
      </div>

      {/* Goal Cards List */}
      {goals.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#140e24] border border-dashed border-purple-500/20">
          <Target className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300">No active milestone goals yet</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            Attach a goal to a habit (e.g. &ldquo;Complete 30 days of Meditation&rdquo;) and treat yourself with a reward.
          </p>
          <button
            onClick={onOpenAddGoal}
            className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md"
          >
            Create Your First Milestone
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const linkedHabit = habits.find(h => h.id === goal.linkedHabitId);
            const { count, percent, isCompleted } = getGoalProgress(goal);

            return (
              <div
                key={goal.id}
                className={`p-5 rounded-3xl border transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-br from-[#18112c] via-[#1a1236] to-[#12281d] border-emerald-500/40 shadow-xl'
                    : 'bg-[#140e24] border-purple-500/20 shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border ${
                        isCompleted
                          ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#1e1538] border-purple-500/30'
                      }`}
                    >
                      {linkedHabit?.icon || '🎯'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white leading-tight">{goal.title}</h3>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            <Trophy className="w-3 h-3 text-emerald-400" />
                            Completed
                          </span>
                        )}
                      </div>

                      {linkedHabit && (
                        <p
                          onClick={() => onOpenHabitDetail(linkedHabit)}
                          className="text-xs text-purple-300 hover:text-purple-200 mt-1 cursor-pointer font-medium flex items-center gap-1"
                        >
                          <span>Linked habit:</span>
                          <span className="underline decoration-purple-400/50">{linkedHabit.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditGoal(goal)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      title="Edit milestone"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this milestone?')) onDeleteGoal(goal.id);
                      }}
                      className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Delete milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Counter */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-zinc-300">Progress</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {count} / {goal.targetCompletions} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#0d0817] rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                          : 'bg-gradient-to-r from-purple-600 via-purple-400 to-amber-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Reward Note if provided */}
                {goal.rewardNote && (
                  <div className="mt-4 p-3 bg-[#1a1233] border border-amber-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-amber-200">
                    <Gift className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-semibold text-zinc-400">Reward:</span>
                    <span className="font-medium text-amber-300 truncate">{goal.rewardNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
