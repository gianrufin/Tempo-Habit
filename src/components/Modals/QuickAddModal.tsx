import React from 'react';
import { HABIT_TEMPLATES } from '../../data/templates';
import { Habit, HabitTemplate } from '../../types';
import { formatLocalDate } from '../../domain/recurrenceEngine';
import { X, Sparkles, Plus } from 'lucide-react';
import { SquircleIcon } from '../SquircleIcon';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFromTemplate: (habit: Habit) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddFromTemplate,
}) => {
  if (!isOpen) return null;

  const handleSelect = (tmpl: HabitTemplate) => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: tmpl.name,
      icon: tmpl.icon,
      color: tmpl.color,
      category: tmpl.category,
      recurrenceRule: tmpl.recurrenceRule,
      timeOfDay: tmpl.timeOfDay,
      createdAt: formatLocalDate(new Date()),
      reminderTimes: ['08:30'],
      streakFreezeAllowance: 1,
      graceDays: 0,
      orderIndex: Date.now(),
    };
    onAddFromTemplate(newHabit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-[#161026] text-zinc-900 dark:text-white border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-[#1a1330]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Curated Habit Starters</h2>
              <p className="text-xs text-zinc-500">Pick a proven daily rhythm to start from scratch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of templates */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HABIT_TEMPLATES.map(tmpl => (
              <div
                key={tmpl.name}
                onClick={() => handleSelect(tmpl)}
                className="group p-3.5 bg-zinc-50 dark:bg-[#1f1638] hover:bg-purple-50 dark:hover:bg-[#251a42] border border-black/5 dark:border-white/5 hover:border-purple-300/40 rounded-2xl cursor-pointer transition-all duration-200 flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-3">
                  <SquircleIcon name={tmpl.icon} color={tmpl.color} size="md" variant="solid" />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                      {tmpl.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wider block mt-0.5">
                      {tmpl.category} • {tmpl.timeOfDay.toLowerCase()}
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                      {tmpl.description}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 group-hover:bg-[#7C69EF] group-hover:text-white text-zinc-400 transition-colors shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-[#1a1330] flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
