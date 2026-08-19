import React, { useState } from 'react';
import { Routine, Habit, TimeOfDay } from '../../types';
import { sortHabitsAscending } from '../../domain/habitSorter';
import { X, Trash2, Check, Sun, Moon } from 'lucide-react';
import { SquircleIcon, AVAILABLE_ICON_KEYS } from '../SquircleIcon';

interface AddEditRoutineModalProps {
  routine?: Routine | null;
  habits: Habit[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  onDelete?: (routineId: string) => void;
}

const DEFAULT_ROUTINE_ICONS = ['sun', 'sunrise', 'sunset', 'moon', 'zap', 'coffee', 'meditation', 'activity', 'sparkles'];
const DEFAULT_COLORS = ['#FFA048', '#7C69EF', '#38BDF8', '#10B981', '#EC4899', '#6366F1'];

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
  const [icon, setIcon] = useState(routine?.icon || 'sun');
  const [color, setColor] = useState(routine?.color || '#FFA048');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161026] text-zinc-900 dark:text-zinc-100 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-black/5 dark:border-white/10 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-[#1a1330]">
          <div className="flex items-center gap-3">
            <SquircleIcon name={icon} color={color} size="md" variant="solid" />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {routine ? 'Edit Routine' : 'Create Routine Flow'}
              </h2>
              <p className="text-xs text-zinc-500">Group habits into morning or evening blocks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Routine Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rise & Energize, Evening Wind-Down..."
              className="w-full text-sm font-semibold p-3.5 rounded-2xl bg-purple-50/50 dark:bg-[#1f1638] border border-purple-200 dark:border-purple-800/40 text-zinc-900 dark:text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Time Block
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['MORNING', 'AFTERNOON', 'EVENING'] as TimeOfDay[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeOfDay(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    timeOfDay === t
                      ? 'bg-[#7C69EF] text-white shadow-sm'
                      : 'bg-zinc-50 dark:bg-[#1f1638] text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/5'
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Squircle Icon
            </label>
            <div className="flex items-center gap-2 overflow-x-auto p-1 no-scrollbar">
              {DEFAULT_ROUTINE_ICONS.map(iKey => {
                const isSelected = icon === iKey;
                return (
                  <button
                    key={iKey}
                    type="button"
                    onClick={() => setIcon(iKey)}
                    className={`p-1 rounded-2xl transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-purple-600 scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <SquircleIcon name={iKey} color={color} size="sm" variant={isSelected ? 'solid' : 'soft'} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Theme Color
            </label>
            <div className="flex items-center gap-2.5 overflow-x-auto p-1 no-scrollbar">
              {DEFAULT_COLORS.map(c => {
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-offset-2 ring-purple-600 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Include Habits in this Routine
            </label>
            {sortedHabits.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No habits created yet. You can link habits later.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sortedHabits.map(h => {
                  const isChecked = selectedHabitIds.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHabit(h.id)}
                      className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-purple-50 dark:bg-[#201838] border-purple-300 dark:border-purple-800 text-zinc-900 dark:text-white'
                          : 'bg-white dark:bg-[#161026] border-black/5 dark:border-white/5 text-zinc-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <SquircleIcon name={h.icon} color={h.color} size="xs" variant="soft" />
                        <span className="text-xs font-semibold">{h.name}</span>
                      </div>
                      {isChecked && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-[#1a1330] flex items-center justify-between">
          {routine && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(routine.id);
                onClose();
              }}
              className="p-2.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="py-2.5 px-6 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-900/20 active:scale-95 transition-all cursor-pointer"
            >
              Save Routine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
