import React, { useState } from 'react';
import { Search, Settings, Flame, Zap, Download, CheckCircle2 } from 'lucide-react';
import { UserPreferences } from '../types';
import { downloadApkDirectly } from '../domain/apkDownloader';

interface TopBarProps {
  userPrefs: UserPreferences;
  selectedDate: string; // YYYY-MM-DD
  activeHabitCount: number;
  completedTodayCount: number;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenReadme?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  userPrefs,
  selectedDate,
  activeHabitCount,
  completedTodayCount,
  onOpenSearch,
  onOpenSettings,
  onOpenReadme,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const progressPercent = activeHabitCount > 0 ? Math.round((completedTodayCount / activeHabitCount) * 100) : 0;

  const handleDownloadClick = async () => {
    if (downloading) return;
    setDownloading(true);
    const ok = await downloadApkDirectly();
    setDownloading(false);
    if (ok) {
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    }
  };

  return (
    <header className="w-full pt-4 pb-3 px-4 sm:px-6 flex items-center justify-between border-b border-white/5 bg-[#0b0714]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-amber-400 p-[1.5px] flex items-center justify-center shadow-md shadow-purple-900/30">
          <div className="w-full h-full bg-[#0e081c] rounded-[14px] flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              {getGreeting()},{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-purple-300 bg-clip-text text-transparent">
                {userPrefs.displayName || 'Friend'}
              </span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400">{formattedDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Daily progress pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18112b] border border-purple-500/20 text-xs text-zinc-300">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          <span>
            {completedTodayCount}/{activeHabitCount} done ({progressPercent}%)
          </span>
        </div>

        {/* Direct In-App Instant APK Download Button */}
        <button
          type="button"
          id="topbar-download-apk-btn"
          disabled={downloading}
          onClick={handleDownloadClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 text-xs font-bold shadow-md shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
          title="Direct Instant APK Download"
        >
          {downloaded ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          ) : (
            <Download className={`w-3.5 h-3.5 text-white ${downloading ? 'animate-bounce' : ''}`} />
          )}
          <span>{downloading ? 'Saving APK...' : downloaded ? 'Downloaded!' : 'Get APK'}</span>
        </button>

        {/* Readme & Guide */}
        {onOpenReadme && (
          <button
            type="button"
            id="topbar-readme-btn"
            onClick={onOpenReadme}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18112b] hover:bg-[#251b42] text-amber-300 hover:text-amber-200 border border-purple-500/20 text-xs font-medium shadow-sm transition-all"
            title="Read README & Installation Guide"
            aria-label="README & Guide"
          >
            <span>Guide</span>
          </button>
        )}

        {/* Search button */}
        <button
          type="button"
          id="topbar-search-btn"
          onClick={onOpenSearch}
          className="p-2.5 rounded-full bg-[#18112b] hover:bg-[#251b42] text-zinc-300 hover:text-white border border-purple-500/10 transition-colors"
          title="Search habits and tasks"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          type="button"
          id="topbar-settings-btn"
          onClick={onOpenSettings}
          className="p-2.5 rounded-full bg-[#18112b] hover:bg-[#251b42] text-zinc-300 hover:text-white border border-purple-500/10 transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
