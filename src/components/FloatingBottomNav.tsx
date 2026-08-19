import React from 'react';
import { LayoutGrid, Clock, Timer, User, Plus } from 'lucide-react';

export type ActiveTab = 'today' | 'calendar' | 'timer' | 'insights';

interface FloatingBottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onQuickAdd: () => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onChangeTab,
  onQuickAdd,
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex items-center justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 dark:bg-[#160f29]/95 backdrop-blur-xl border border-black/5 dark:border-white/10 p-1.5 rounded-full shadow-xl shadow-purple-950/15 dark:shadow-purple-950/50 flex items-center gap-1.5 sm:gap-2">
        {/* Home / Today */}
        <button
          type="button"
          onClick={() => onChangeTab('today')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-[#7C69EF] text-white shadow-md shadow-purple-900/30'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
          aria-label="Today"
        >
          <LayoutGrid className="w-5 h-5" strokeWidth={activeTab === 'today' ? 2.4 : 2} />
        </button>

        {/* Timeline & Alarms */}
        <button
          type="button"
          onClick={() => onChangeTab('calendar')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-[#7C69EF] text-white shadow-md shadow-purple-900/30'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
          aria-label="Timeline"
        >
          <Clock className="w-5 h-5" strokeWidth={activeTab === 'calendar' ? 2.4 : 2} />
        </button>

        {/* Floating Action Button (FAB) + */}
        <button
          type="button"
          onClick={onQuickAdd}
          className="w-12 h-12 rounded-full bg-[#1e1538] dark:bg-purple-600 hover:bg-[#2b1f4f] dark:hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-950/40 active:scale-95 transition-all cursor-pointer mx-1"
          aria-label="Add Habit or Routine"
          title="Add Habit, Routine, or Task"
        >
          <Plus className="w-6 h-6" strokeWidth={2.6} />
        </button>

        {/* Focus Chamber Timer */}
        <button
          type="button"
          onClick={() => onChangeTab('timer')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'timer'
              ? 'bg-[#7C69EF] text-white shadow-md shadow-purple-900/30'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
          aria-label="Timer"
        >
          <Timer className="w-5 h-5" strokeWidth={activeTab === 'timer' ? 2.4 : 2} />
        </button>

        {/* Profile & Stats */}
        <button
          type="button"
          onClick={() => onChangeTab('insights')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'bg-[#7C69EF] text-white shadow-md shadow-purple-900/30'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
          aria-label="Profile"
        >
          <User className="w-5 h-5" strokeWidth={activeTab === 'insights' ? 2.4 : 2} />
        </button>
      </nav>
    </div>
  );
};
