import React, { useEffect } from 'react';
import { Bell, CheckCircle2, Coffee, RotateCcw, Volume2, Sparkles, X, Flame } from 'lucide-react';
import { startTimerAlarmLoop, stopTimerAlarmLoop, playCelebrationSound } from '../../audio/soundPlayer';
import { Habit, UserPreferences } from '../../types';
import { SquircleIcon } from '../SquircleIcon';

interface TimerAlarmSplashProps {
  isOpen: boolean;
  habit?: Habit | null;
  phaseLabel: string;
  durationMinutes: number;
  userPrefs: UserPreferences;
  onDismiss: () => void;
  onStartBreak?: () => void;
  onSnooze?: () => void;
}

export const TimerAlarmSplash: React.FC<TimerAlarmSplashProps> = ({
  isOpen,
  habit,
  phaseLabel,
  durationMinutes,
  userPrefs,
  onDismiss,
  onStartBreak,
  onSnooze,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (userPrefs.soundEnabled) {
        startTimerAlarmLoop(userPrefs.soundChoice);
      }
    } else {
      stopTimerAlarmLoop();
    }

    return () => {
      stopTimerAlarmLoop();
    };
  }, [isOpen, userPrefs.soundEnabled, userPrefs.soundChoice]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    stopTimerAlarmLoop();
    playCelebrationSound();
    onDismiss();
  };

  const handleBreak = () => {
    stopTimerAlarmLoop();
    if (onStartBreak) onStartBreak();
  };

  const handleSnooze = () => {
    stopTimerAlarmLoop();
    if (onSnooze) onSnooze();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#180d38] via-[#0e0720] to-[#080312] text-white animate-fade-in select-none">
      {/* Top Bar with Dismiss */}
      <div className="w-full max-w-md flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-purple-300">
          <Volume2 className="w-3.5 h-3.5 animate-pulse text-purple-400" />
          <span>Timer Ringing</span>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Alarm Hero Display */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm w-full py-6">
        {/* Pulsing Radial Alarm Bell Squircle */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full bg-purple-600/30 blur-2xl animate-radial-pulse" />
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#7C69EF] to-[#FF8522] text-white flex items-center justify-center shadow-2xl shadow-purple-950/80 border-2 border-white/20 animate-alarm-bounce relative z-10">
            <Bell className="w-12 h-12 fill-white stroke-none" />
          </div>
        </div>

        {/* 00:00 Giant Display */}
        <div className="space-y-1">
          <span className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
            00:00
          </span>
          <p className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{phaseLabel} Complete!</span>
          </p>
        </div>

        {/* Linked Habit or Focus Info Card */}
        {habit ? (
          <div className="w-full p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3.5 shadow-lg">
            <SquircleIcon name={habit.icon} color={habit.color} size="md" variant="solid" />
            <div className="text-left">
              <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                {habit.name}
              </h4>
              <p className="text-xs text-purple-200">
                +{durationMinutes} minutes added to daily momentum
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-300">
            +{durationMinutes} focus minutes logged in Tempo Chamber
          </div>
        )}
      </div>

      {/* Bottom Material 3 Actions */}
      <div className="w-full max-w-md space-y-3 pb-6">
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-[#7C69EF] to-[#6351DE] hover:from-[#8b79f7] hover:to-[#7361ee] text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-purple-950/50 active:scale-98 transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Stop &amp; Complete Session</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          {onStartBreak && (
            <button
              type="button"
              onClick={handleBreak}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-amber-300" />
              <span>Start 5m Break</span>
            </button>
          )}

          {onSnooze && (
            <button
              type="button"
              onClick={handleSnooze}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-purple-300" />
              <span>Snooze (+5m)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
