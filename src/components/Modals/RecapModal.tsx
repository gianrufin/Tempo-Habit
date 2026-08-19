import React from 'react';
import { Habit, HabitCompletion, MoodRecord } from '../../types';
import { calculateStreak } from '../../domain/streakCalculator';
import { X, Sparkles, Flame, Trophy, CheckCircle2, Share2, Copy } from 'lucide-react';

interface RecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  completions: HabitCompletion[];
  moods: MoodRecord[];
  displayName: string;
}

export const RecapModal: React.FC<RecapModalProps> = ({
  isOpen,
  onClose,
  habits,
  completions,
  moods,
  displayName,
}) => {
  if (!isOpen) return null;

  const totalCompletions = completions.filter(c => c.status === 'COMPLETED').length;

  const { bestStreakHabit, maxStreak } = React.useMemo(() => {
    let best: Habit | null = null;
    let max = 0;
    for (const h of habits) {
      const stats = calculateStreak(h, completions, new Date());
      if (stats.currentStreak > max) {
        max = stats.currentStreak;
        best = h;
      }
    }
    return { bestStreakHabit: best, maxStreak: max };
  }, [habits, completions]);

  const avgMood = moods.length > 0
    ? (moods.reduce((acc, m) => acc + m.mood, 0) / moods.length).toFixed(1)
    : '4.5';

  const [copied, setCopied] = React.useState(false);

  const handleShareText = () => {
    const text = `⚡ My Tempo Habit Tracker Progress:
🔥 Longest Active Streak: ${maxStreak} days ${bestStreakHabit ? `(${bestStreakHabit.name})` : ''}
✅ Total Habit Completions: ${totalCompletions}
✨ Average Mood Score: ${avgMood} / 5.0
Track your momentum with Tempo!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#18112b]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Your Tempo Recap Card</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Celebratory Card Body */}
        <div className="p-6 space-y-5">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/60 via-[#1f133d] to-amber-950/40 border border-amber-400/30 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" /> High Momentum Achieved
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight">
              {displayName || 'Tempo Champion'}
            </h3>
            <p className="text-xs text-purple-200 mt-1">Consistency & Mindset Summary</p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <span className="text-2xl font-black text-amber-300">{maxStreak}</span>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Day Best Streak</p>
              </div>

              <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-2xl font-black text-emerald-300">{totalCompletions}</span>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Completed</p>
              </div>
            </div>

            {bestStreakHabit && (
              <div className="mt-4 p-3 bg-white/5 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{bestStreakHabit.icon}</span>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold uppercase">Top Habit</p>
                    <p className="text-xs font-bold text-white">{bestStreakHabit.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-300">🔥 {maxStreak}d</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-[#18112b] flex items-center justify-between">
          <button
            onClick={handleShareText}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/40 transition-all"
          >
            {copied ? <Copy className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Summary Copied to Clipboard!' : 'Copy & Share Summary'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
