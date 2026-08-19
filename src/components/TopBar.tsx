import React from 'react';
import { Search, Settings, RefreshCw, Sun, Moon, ShieldCheck } from 'lucide-react';
import { UserPreferences } from '../types';
import { SquircleIcon } from './SquircleIcon';

interface TopBarProps {
  userPrefs: UserPreferences;
  selectedDate: string; // YYYY-MM-DD
  activeHabitCount: number;
  completedTodayCount: number;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenUpdateModal?: () => void;
  onOpenPermissions?: () => void;
  onToggleTheme?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  userPrefs,
  selectedDate,
  activeHabitCount,
  completedTodayCount,
  onOpenSearch,
  onOpenSettings,
  onOpenUpdateModal,
  onOpenPermissions,
  onToggleTheme,
}) => {
  const isLight = userPrefs.theme === 'light';

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="w-full pt-[max(1rem,env(safe-area-inset-top,1rem))] pb-3 px-4 sm:px-6 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-[#F4F3FB]/90 dark:bg-[#0E091C]/90 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* User Info & Squircle Avatar */}
      <div className="flex items-center gap-3">
        <SquircleIcon name="zap" color="#7C69EF" size="md" variant="solid" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Hi, {userPrefs.displayName || 'Gian'}
            </h1>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            {formattedDate} • {completedTodayCount}/{activeHabitCount} completed
          </p>
        </div>
      </div>

      {/* Action Buttons in Squircles */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* App Permissions & System Capabilities */}
        {onOpenPermissions && (
          <button
            type="button"
            onClick={onOpenPermissions}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1433] hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-black/5 dark:border-white/5 shadow-sm transition-all cursor-pointer"
            title="App Permissions & Diagnostics"
            aria-label="App Permissions"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        )}

        {/* In-App GitHub OTA Check for Updates */}
        {onOpenUpdateModal && (
          <button
            type="button"
            onClick={onOpenUpdateModal}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1433] hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-300 border border-purple-500/20 shadow-sm transition-all cursor-pointer"
            title="Check for GitHub Updates"
            aria-label="Check for updates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle (Light / Dark) */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1433] text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-300 border border-black/5 dark:border-white/5 shadow-sm transition-all cursor-pointer"
            title="Toggle Light / Dark Mode"
            aria-label="Toggle Theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        )}

        {/* Search */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1433] text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-300 border border-black/5 dark:border-white/5 shadow-sm transition-all cursor-pointer"
          title="Search habits and tasks"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1433] text-zinc-600 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-300 border border-black/5 dark:border-white/5 shadow-sm transition-all cursor-pointer"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
