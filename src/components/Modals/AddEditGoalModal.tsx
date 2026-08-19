import React, { useState } from 'react';
import { Goal, Habit } from '../../types';
import { formatLocalDate } from '../../domain/recurrenceEngine';
import { sortHabitsAscending } from '../../domain/habitSorter';
import { X, Trash2, Plus, Minus, Target } from 'lucide-react';

interface AddEditGoalModalProps {
  goal?: Goal | null;
  habits: Habit[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
}

export const AddEditGoalModal: React.FC<AddEditGoalModalProps> = ({
  goal,
  habits,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const sortedHabits = sortHabitsAscending(habits);
  const [title, setTitle] = useState(goal?.title || '');
  const [linkedHabitId, setLinkedHabitId] = useState(goal?.linkedHabitId || (sortedHabits[0]?.id || ''));
  const [targetCompletions, setTargetCompletions] = useState(goal?.targetCompletions || 30);
  const [rewardNote, setRewardNote] = useState(goal?.rewardNote || '');

  const handleSave = () => {
    if (!title.trim() || !linkedHabitId) return;

    const updatedGoal: Goal = {
      id: goal?.id || `goal-${Date.now()}`,
      title: title.trim(),
      linkedHabitId,
      targetCompletions,
      createdAt: goal?.createdAt || formatLocalDate(new Date()),
      completedAt: goal?.completedAt,
      rewardNote: rewardNote.trim() || undefined,
    };

    onSave(updatedGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md max-h-[90vh] bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#18112b]">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              {goal ? 'Edit Goal' : 'New Milestone Goal'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {goal && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this goal?')) {
                    onDelete(goal.id);
                    onClose();
                  }
                }}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                title="Delete goal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
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
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 50 Sessions of Deep Meditation"
              className="w-full px-4 py-3 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Linked Habit
            </label>
            <select
              value={linkedHabitId}
              onChange={e => setLinkedHabitId(e.target.value)}
              className="w-full px-4 py-3 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
            >
              {sortedHabits.map(h => (
                <option key={h.id} value={h.id}>
                  {h.icon} {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Target Completions Count
            </label>
            <div className="flex items-center justify-between p-3.5 bg-[#1b1330] rounded-xl border border-white/5">
              <span className="text-xl font-bold text-amber-300">
                {targetCompletions} completions
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetCompletions(Math.max(5, targetCompletions - 5))}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => setTargetCompletions(targetCompletions + 5)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Reward / Celebration Note (Optional)
            </label>
            <input
              type="text"
              value={rewardNote}
              onChange={e => setRewardNote(e.target.value)}
              placeholder="e.g. Buy new running shoes, special dinner"
              className="w-full px-4 py-3 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#18112b] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || !linkedHabitId}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/40 disabled:opacity-50"
          >
            {goal ? 'Save Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};
