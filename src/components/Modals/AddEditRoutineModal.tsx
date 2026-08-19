import React, { useState } from 'react';
import { Routine, Habit, TimeOfDay } from '../../types';
import { sortHabitsAscending } from '../../domain/habitSorter';
import { X, Trash2, Check } from 'lucide-react';

interface AddEditRoutineModalProps {
  routine?: Routine | null;
  habits: Habit[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  onDelete?: (routineId: string) => void;
}

const DEFAULT_ROUTINE_ICONS = ['☀️', '🌙', '🌅', '⚡', '☕', '🧘', '🎯', '🌿', '🚀'];
const DEFAULT_COLORS = ['#F59E0B', '#8B5CF6', '#38BDF8', '#10B981', '#EC4899', '#6366F1'];

export const AddEditRoutineModal: React.FC<AddEditRoutineModalProps> = ({
  routine,
  habits,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const sortedHabits = sortHabitsAscending(habits);
  const [name, setName] = useState(routine?.name || '');
  const [icon, setIcon] = useState(routine?.icon || '☀️');
  const [color, setColor] = useState(routine?.color || '#F59E0B');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(routine?.timeOfDay || 'MORNING');
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(routine?.habitIds || []);

  const toggleHabit = (id: string) => {
    if (selectedHabitIds.includes(id)) {
      setSelectedHabitIds(selectedHabitIds.filter(h => h !== id));
    } else {
      setSelectedHabitIds([...selectedHabitIds, id]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const updatedRoutine: Routine = {
      id: routine?.id || `routine-${Date.now()}`,
      name: name.trim(),
      icon,
      color,
      timeOfDay,
      habitIds: selectedHabitIds,
    };

    onSave(updatedRoutine);
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
          <h2 className="text-lg font-bold text-white">
            {routine ? 'Edit Routine' : 'New Routine'}
          </h2>
          <div className="flex items-center gap-2">
            {routine && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this routine? Habits inside will remain intact.')) {
                    onDelete(routine.id);
                    onClose();
                  }
                }}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                title="Delete routine"
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
              Routine Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Morning Focus Flow"
              className="w-full px-4 py-3 bg-[#0d0818] border border-purple-500/20 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ROUTINE_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === ic
                      ? 'bg-purple-600 text-white ring-2 ring-amber-400 scale-105'
                      : 'bg-[#1b1330] hover:bg-[#251a42] text-zinc-300'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Time of Day
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as TimeOfDay[]).map(tod => (
                <button
                  key={tod}
                  type="button"
                  onClick={() => setTimeOfDay(tod)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium capitalize transition-all ${
                    timeOfDay === tod
                      ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold shadow-sm'
                      : 'bg-[#1b1330] text-zinc-400 hover:text-white'
                  }`}
                >
                  {tod.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Include Habits in this Routine
            </label>
            {sortedHabits.length === 0 ? (
              <p className="text-xs text-zinc-500">Create habits first to bundle them into routines.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sortedHabits.map(h => {
                  const isSelected = selectedHabitIds.includes(h.id);
                  return (
                    <div
                      key={h.id}
                      onClick={() => toggleHabit(h.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500/40 text-white'
                          : 'bg-[#0d0818] border-white/5 text-zinc-400 hover:bg-[#1b1330]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span>{h.icon}</span>
                        <span className="text-xs font-semibold">{h.name}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                          isSelected ? 'bg-amber-400 border-amber-400 text-black' : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            disabled={!name.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/40 disabled:opacity-50"
          >
            {routine ? 'Save Changes' : 'Create Routine'}
          </button>
        </div>
      </div>
    </div>
  );
};
