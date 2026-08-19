import React, { useState } from 'react';
import {
  User,
  Flame,
  Award,
  Sparkles,
  RefreshCw,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Moon,
  Sun,
  Star,
  Trophy,
  GitBranch,
} from 'lucide-react';
import { Habit, HabitCompletion, UserPreferences } from '../types';
import { CURRENT_APP_VERSION, DEFAULT_GITHUB_REPO } from '../domain/updaterService';
import { SquircleIcon } from '../components/SquircleIcon';

interface InsightsScreenProps {
  habits: Habit[];
  completions: HabitCompletion[];
  userPrefs: UserPreferences;
  onOpenUpdateModal: () => void;
  onOpenSettings: () => void;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  habits,
  completions,
  userPrefs,
  onOpenUpdateModal,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'STATS' | 'ACHIEVEMENTS' | 'UPDATES'>('STATS');

  const totalCompletions = completions.filter(c => c.status === 'COMPLETED').length;
  const bestStreak = totalCompletions > 0 ? Math.min(totalCompletions, 7) : 0;

  // Mock weekly curve points for smooth SVG chart
  const weeklyData = [
    { day: 'Mon', val: 70 },
    { day: 'Tue', val: 85 },
    { day: 'Wed', val: 50 },
    { day: 'Thu', val: 90 },
    { day: 'Fri', val: 95 },
    { day: 'Sat', val: 80 },
    { day: 'Sun', val: 100 },
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-5 animate-fade-in">
      {/* 1. Header & Profile Banner (Screen 3 Top) */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          Profile &amp; Insights
        </h2>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
        >
          Preferences
        </button>
      </div>

      {/* Dark Profile Banner Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#171026] text-white flex items-center justify-between shadow-lg shadow-purple-950/20 border border-white/10 relative overflow-hidden">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-amber-400 p-0.5 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#171026] rounded-[14px] flex items-center justify-center text-amber-300">
              <User className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">
              {userPrefs.displayName || 'Gian Rufin'}
            </h3>
            <p className="text-xs text-zinc-400 font-medium">Daily Habit Builder</p>
          </div>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 relative z-10">
          <Moon className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Sub Navigation Tabs (Screen 3 Tabs) */}
      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#161026] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('STATS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'STATS'
              ? 'bg-[#7C69EF] text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          My Stats
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ACHIEVEMENTS'
              ? 'bg-[#7C69EF] text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          Achievements
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UPDATES')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'UPDATES'
              ? 'bg-[#7C69EF] text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          OTA Updates
        </button>
      </div>

      {/* TAB 1: STATS BENTO GRID & CHART */}
      {activeTab === 'STATS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Average Wake-Up / Focus Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#ECE8FD] dark:bg-[#1E1638] border border-purple-300/60 dark:border-purple-800/50 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#7C69EF] text-white flex items-center justify-center shadow-md shadow-purple-900/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Target Wake-Up &amp; Start
                </span>
                <h4 className="text-xl font-black text-zinc-900 dark:text-white">
                  6:42 AM
                </h4>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-200/80 dark:bg-purple-900/60 px-2.5 py-1 rounded-xl">
              This Week
            </span>
          </div>

          {/* 2-Card Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFA048] to-[#FF6B00] text-white space-y-1 shadow-md shadow-orange-950/20">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Best Streak
              </span>
              <div className="text-2xl font-black">{bestStreak} days</div>
            </div>

            <div className="p-4 rounded-3xl bg-[#ECE8FD] dark:bg-[#1E1638] border border-purple-300/60 dark:border-purple-800/50 space-y-1 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[#7C69EF]/20 text-[#7C69EF] flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Most Recent
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-white">
                6:15 AM
              </div>
            </div>
          </div>

          {/* Weekly Progress Smooth Curve SVG Chart (Screen 4 Chart) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Weekly Completion Curve
              </span>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Last Week &darr;
              </span>
            </div>

            <div className="h-32 w-full flex items-end justify-between gap-2 pt-4">
              {weeklyData.map(item => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-purple-100 dark:bg-purple-950/50 rounded-2xl p-1 flex items-end h-24">
                    <div
                      className="w-full bg-[#7C69EF] rounded-xl transition-all duration-300"
                      style={{ height: `${item.val}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-400 font-mono">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACHIEVEMENTS SQUIRCLE BADGES (Screen 4 Layout) */}
      {activeTab === 'ACHIEVEMENTS' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 space-y-3 shadow-sm">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Milestone Badges
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: 'Early Bird', icon: 'sun', unlocked: true },
                { title: 'No Snooze', icon: 'bell', unlocked: true },
                { title: '5 Day Streak', icon: 'flame', unlocked: bestStreak >= 5 },
                { title: 'Morning Star', icon: 'star', unlocked: true },
                { title: 'Focus Champion', icon: 'trophy', unlocked: true },
                { title: 'Night Calm', icon: 'moon', unlocked: false },
              ].map(badge => (
                <div
                  key={badge.title}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                    badge.unlocked
                      ? 'bg-[#ECE8FD] dark:bg-[#1E1638] border-purple-300/40 dark:border-purple-800/40 text-zinc-900 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900/40 border-black/5 dark:border-white/5 text-zinc-400 opacity-60'
                  }`}
                >
                  <SquircleIcon name={badge.icon} color="#7C69EF" size="sm" variant={badge.unlocked ? 'solid' : 'soft'} />
                  <span className="text-xs font-bold">{badge.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OTA UPDATES & GITHUB DIRECT INSTALLER */}
      {activeTab === 'UPDATES' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  In-App GitHub OTA Updater
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Direct connection to {DEFAULT_GITHUB_REPO}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">Installed Version</span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
                v{CURRENT_APP_VERSION}
              </span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              When updates are published to your repository, Tempo detects them in real-time, downloads the APK, prompts for the package install permission, and updates the application directly.
            </p>

            <button
              type="button"
              onClick={onOpenUpdateModal}
              className="w-full py-3 px-4 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Check for Updates (Direct GitHub)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
