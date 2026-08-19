import React from 'react';
import { Sparkles, CheckSquare, Timer, CalendarDays, TrendingUp, Target } from 'lucide-react';

export type TabType = 'today' | 'tasks' | 'timer' | 'calendar' | 'insights' | 'goals';

interface FloatingBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'today' as TabType, label: 'Today', icon: Sparkles },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
    { id: 'timer' as TabType, label: 'Timer', icon: Timer },
    { id: 'calendar' as TabType, label: 'Calendar', icon: CalendarDays },
    { id: 'insights' as TabType, label: 'Insights', icon: TrendingUp },
    { id: 'goals' as TabType, label: 'Goals', icon: Target },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto">
      <nav
        id="floating-bottom-nav"
        className="flex items-center justify-around sm:justify-center sm:gap-1.5 px-3 py-2 bg-[#160f29]/95 backdrop-blur-xl border border-purple-500/20 rounded-full shadow-2xl shadow-purple-950/60"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold shadow-lg shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[11px] sm:text-xs tracking-tight whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-300 rounded-full shadow-sm shadow-amber-300" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
