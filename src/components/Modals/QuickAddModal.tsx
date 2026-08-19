import React from 'react';
import { HABIT_TEMPLATES } from '../../data/templates';
import { Habit, HabitTemplate } from '../../types';
import { formatLocalDate } from '../../domain/recurrenceEngine';
import { X, Sparkles, Plus } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[90vh] bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#18112b]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Curated Habit Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of templates */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <p className="text-xs text-zinc-400 mb-2">
            Choose a proven habit to instantly add to your daily schedule with optimal defaults:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HABIT_TEMPLATES.map(tmpl => (
              <div
                key={tmpl.name}
                onClick={() => handleSelect(tmpl)}
                className="group p-3.5 bg-[#1b1330] hover:bg-[#251a42] border border-purple-500/15 hover:border-amber-400/40 rounded-2xl cursor-pointer transition-all duration-200 flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl p-2 bg-[#0e081c] rounded-xl flex-shrink-0">
                    {tmpl.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {tmpl.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider block mt-0.5">
                      {tmpl.category} • {tmpl.timeOfDay.toLowerCase()}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1 leading-snug">
                      {tmpl.description}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-amber-400 group-hover:text-black text-zinc-400 transition-colors flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#18112b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
