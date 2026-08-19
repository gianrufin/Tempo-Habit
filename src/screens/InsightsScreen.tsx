import React from 'react';
import { Habit, HabitCompletion, MoodRecord, Goal } from '../types';
import { calculateStreak } from '../domain/streakCalculator';
import { formatLocalDate, addDays } from '../domain/recurrenceEngine';
import { TrendingUp, Flame, Trophy, Award, Sparkles, PieChart, Activity, Smile, Share2 } from 'lucide-react';

interface InsightsScreenProps {
  habits: Habit[];
  completions: HabitCompletion[];
  moods: MoodRecord[];
  goals: Goal[];
  onOpenRecap: () => void;
  onOpenHabitDetail: (habit: Habit) => void;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  habits,
  completions,
  moods,
  goals,
  onOpenRecap,
  onOpenHabitDetail,
}) => {
  const today = new Date();

  // Streak computations
  const habitStats = habits.map(h => {
    const s = calculateStreak(h, completions, today);
    return {
      habit: h,
      stats: s,
    };
  });

  // Sort by current streak descending
  const sortedByStreak = [...habitStats].sort((a, b) => b.stats.currentStreak - a.stats.currentStreak);

  // Weekly completion analysis (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const dateStr = formatLocalDate(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = completions.filter(c => c.date === dateStr && c.status === 'COMPLETED').length;
    last7Days.push({ dateStr, dayName, count });
  }

  const maxDailyCompletions = Math.max(...last7Days.map(d => d.count), 1);

  // Category distribution
  const categoryCounts: Record<string, { total: number; completed: number }> = {};
  habits.forEach(h => {
    const cat = h.category || 'General';
    if (!categoryCounts[cat]) categoryCounts[cat] = { total: 0, completed: 0 };
    categoryCounts[cat].total += 1;
    const comps = completions.filter(c => c.habitId === h.id && c.status === 'COMPLETED').length;
    categoryCounts[cat].completed += comps;
  });

  // Time of Day distribution
  const timeOfDayCounts: Record<string, number> = {
    MORNING: 0,
    AFTERNOON: 0,
    EVENING: 0,
    NIGHT: 0,
    ANYTIME: 0,
  };
  habits.forEach(h => {
    timeOfDayCounts[h.timeOfDay] = (timeOfDayCounts[h.timeOfDay] || 0) + 1;
  });

  // Total completions
  const totalCompletedAllTime = completions.filter(c => c.status === 'COMPLETED').length;
  const totalFreezesUsed = completions.filter(c => c.status === 'SKIPPED_EXCUSED').length;

  // Average mood calculation
  const avgMood = moods.length > 0
    ? (moods.reduce((acc, m) => acc + m.mood, 0) / moods.length).toFixed(1)
    : '4.5';

  return (
    <div className="pb-28 px-4 sm:px-6 pt-4 max-w-4xl mx-auto space-y-6">
      {/* Top Banner & Recap Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-purple-900/40 via-purple-800/20 to-amber-900/30 border border-purple-500/30 rounded-3xl backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Performance & Insights</h2>
          </div>
          <p className="text-xs text-zinc-300 mt-1">
            Analyzing your momentum, streaks, and behavioral consistency
          </p>
        </div>

        <button
          onClick={onOpenRecap}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-zinc-950 font-bold rounded-2xl text-xs shadow-lg shadow-purple-950/40 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-zinc-950" />
          <span>View Tempo Recap</span>
          <Share2 className="w-3.5 h-3.5 ml-1 text-zinc-950" />
        </button>
      </div>

      {/* Hero 4-Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#140e24] border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completions</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalCompletedAllTime}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">All-time checked</p>
        </div>

        <div className="p-4 bg-[#140e24] border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Top Streak</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {Math.max(...habitStats.map(h => h.stats.longestStreak), 0)}{' '}
            <span className="text-xs font-normal text-zinc-400">days</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Personal record</p>
        </div>

        <div className="p-4 bg-[#140e24] border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Mood</span>
            <Smile className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {avgMood} <span className="text-xs font-normal text-zinc-400">/ 5.0</span>
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Well-being index</p>
        </div>

        <div className="p-4 bg-[#140e24] border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Freezes</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalFreezesUsed}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Grace days used</p>
        </div>
      </div>

      {/* 7-Day Velocity Bar Chart */}
      <div className="p-5 bg-[#140e24] border border-purple-500/20 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Weekly Activity Rhythm</h3>
          </div>
          <span className="text-xs text-zinc-400">Last 7 Days</span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4 border-b border-white/5 pb-2">
          {last7Days.map(d => {
            const heightPercent = Math.max((d.count / maxDailyCompletions) * 100, 10);
            return (
              <div key={d.dateStr} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-bold text-amber-300 font-mono">{d.count}</span>
                <div className="w-full max-w-[32px] bg-[#1a1230] rounded-xl overflow-hidden h-full flex flex-col justify-end p-0.5">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 via-purple-500 to-amber-400 rounded-lg transition-all duration-500 shadow-sm shadow-purple-600/50"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-zinc-400">{d.dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Leaderboard */}
      <div className="p-5 bg-[#140e24] border border-purple-500/20 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Habit Streak Leaderboard</h3>
          </div>
          <span className="text-xs text-zinc-400">{habits.length} active</span>
        </div>

        <div className="space-y-2.5">
          {sortedByStreak.map((item, idx) => {
            const { habit, stats } = item;
            return (
              <div
                key={habit.id}
                onClick={() => onOpenHabitDetail(habit)}
                className="p-3.5 bg-[#17102a] hover:bg-[#20163b] border border-white/5 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold font-mono text-zinc-500 w-4">#{idx + 1}</span>
                  <span className="text-2xl flex-shrink-0">{habit.icon}</span>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{habit.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      Best: {stats.longestStreak} days • {stats.totalCompletions} total checks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 font-bold text-xs">
                    <Flame className="w-3.5 h-3.5 fill-amber-400/40" />
                    <span>{stats.currentStreak}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories and Time of Day breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="p-5 bg-[#140e24] border border-purple-500/20 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Focus by Category</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, data]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-semibold">{cat}</span>
                  <span className="text-zinc-400">{data.completed} completions</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"
                    style={{
                      width: `${Math.min((data.completed / (totalCompletedAllTime || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time of Day Distribution */}
        <div className="p-5 bg-[#140e24] border border-purple-500/20 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Time-of-Day Allocation</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'MORNING', label: 'Morning', icon: '🌅', count: timeOfDayCounts['MORNING'] },
              { id: 'AFTERNOON', label: 'Afternoon', icon: '☀️', count: timeOfDayCounts['AFTERNOON'] },
              { id: 'EVENING', label: 'Evening', icon: '🌆', count: timeOfDayCounts['EVENING'] },
              { id: 'NIGHT', label: 'Night', icon: '🌙', count: timeOfDayCounts['NIGHT'] },
            ].map(tod => (
              <div key={tod.id} className="p-3 bg-[#18112c] rounded-2xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-lg">{tod.icon}</span>
                  <span className="text-base font-bold text-white">{tod.count}</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium mt-1">{tod.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
