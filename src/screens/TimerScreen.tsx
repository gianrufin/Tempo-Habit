import React, { useState, useEffect, useRef } from 'react';
import { Habit, TimerMode, PomodoroPhase, UserPreferences } from '../types';
import { playSound, playCelebrationSound } from '../audio/soundPlayer';
import { sortHabitsAscending } from '../domain/habitSorter';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Sparkles, CheckCircle2, Flame } from 'lucide-react';

interface TimerScreenProps {
  habits: Habit[];
  userPrefs: UserPreferences;
  onCompleteHabit?: (habitId: string) => void;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({
  habits,
  userPrefs,
  onCompleteHabit,
}) => {
  const sortedHabits = sortHabitsAscending(habits);
  const [timerMode, setTimerMode] = useState<TimerMode>('POMODORO');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('FOCUS');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [selectedHabitId, setSelectedHabitId] = useState<string>(sortedHabits[0]?.id || '');
  
  // Timer numerical values
  const focusSeconds = (userPrefs.focusDurationMinutes || 25) * 60;
  const shortBreakSeconds = (userPrefs.shortBreakMinutes || 5) * 60;
  const longBreakSeconds = (userPrefs.longBreakMinutes || 15) * 60;

  const [timeLeft, setTimeLeft] = useState<number>(focusSeconds);
  const [totalDuration, setTotalDuration] = useState<number>(focusSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(userPrefs.soundEnabled ?? true);
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(3);
  const [totalMinutesToday, setTotalMinutesToday] = useState<number>(75);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial duration when mode or phase changes
  const setPhase = (phase: PomodoroPhase) => {
    setIsRunning(false);
    setPomodoroPhase(phase);
    let dur = focusSeconds;
    if (phase === 'SHORT_BREAK') dur = shortBreakSeconds;
    if (phase === 'LONG_BREAK') dur = longBreakSeconds;
    setTotalDuration(dur);
    setTimeLeft(dur);
  };

  useEffect(() => {
    if (timerMode === 'POMODORO') {
      setPhase(pomodoroPhase);
    } else if (timerMode === 'COUNTDOWN') {
      setTotalDuration(focusSeconds);
      setTimeLeft(focusSeconds);
      setIsRunning(false);
    } else if (timerMode === 'STOPWATCH') {
      setIsRunning(false);
    }
  }, [timerMode, userPrefs.focusDurationMinutes, userPrefs.shortBreakMinutes, userPrefs.longBreakMinutes]);

  // Main timer ticking effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (timerMode === 'STOPWATCH') {
          setStopwatchSeconds(prev => prev + 1);
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleTimerCompleted();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode, pomodoroPhase, pomodoroCount]);

  const handleTimerCompleted = () => {
    setIsRunning(false);
    if (soundEnabled) {
      playSound(userPrefs.soundChoice, 0.7);
      setTimeout(() => playCelebrationSound(), 300);
    }

    if (timerMode === 'POMODORO') {
      if (pomodoroPhase === 'FOCUS') {
        const nextCount = pomodoroCount + 1;
        setPomodoroCount(nextCount);
        setCompletedSessionsToday(prev => prev + 1);
        setTotalMinutesToday(prev => prev + Math.round(totalDuration / 60));

        // If a habit was selected, offer or auto-complete
        if (selectedHabitId && onCompleteHabit) {
          onCompleteHabit(selectedHabitId);
        }

        const isLongBreak = nextCount % (userPrefs.pomodorosUntilLongBreak || 4) === 0;
        setPhase(isLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK');
        if (userPrefs.autoStartBreaks) {
          setTimeout(() => setIsRunning(true), 1200);
        }
      } else {
        // Break finished, go back to focus
        setPhase('FOCUS');
      }
    } else if (timerMode === 'COUNTDOWN') {
      setCompletedSessionsToday(prev => prev + 1);
      setTotalMinutesToday(prev => prev + Math.round(totalDuration / 60));
      if (selectedHabitId && onCompleteHabit) {
        onCompleteHabit(selectedHabitId);
      }
    }
  };

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerMode === 'STOPWATCH') {
      setStopwatchSeconds(0);
    } else {
      setTimeLeft(totalDuration);
    }
  };

  const handleSkipPhase = () => {
    setIsRunning(false);
    if (pomodoroPhase === 'FOCUS') {
      const isLongBreak = (pomodoroCount + 1) % (userPrefs.pomodorosUntilLongBreak || 4) === 0;
      setPhase(isLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK');
    } else {
      setPhase('FOCUS');
    }
  };

  const handleSetCustomDuration = (minutes: number) => {
    setIsRunning(false);
    const secs = minutes * 60;
    setTotalDuration(secs);
    setTimeLeft(secs);
  };

  // Format Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    timerMode === 'STOPWATCH'
      ? 100
      : totalDuration > 0
      ? ((totalDuration - timeLeft) / totalDuration) * 100
      : 0;

  // SVG Circular progress constants
  const size = 260;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const activeHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <div className="pb-28 px-4 sm:px-6 pt-4 max-w-xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Focus Chamber</h2>
          <p className="text-xs text-zinc-400">Deep concentration & interval training</p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-full border transition-colors ${
            soundEnabled
              ? 'bg-purple-950/60 border-purple-500/30 text-amber-300'
              : 'bg-zinc-900 border-white/10 text-zinc-500'
          }`}
          title={soundEnabled ? 'Sound enabled' : 'Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="w-full flex p-1 bg-[#140e24] border border-purple-500/15 rounded-2xl mb-6">
        {(['POMODORO', 'COUNTDOWN', 'STOPWATCH'] as TimerMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setTimerMode(mode)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all ${
              timerMode === mode
                ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {mode === 'POMODORO' ? 'Pomodoro' : mode === 'COUNTDOWN' ? 'Countdown' : 'Stopwatch'}
          </button>
        ))}
      </div>

      {/* Pomodoro Phase Tabs */}
      {timerMode === 'POMODORO' && (
        <div className="flex items-center gap-2 mb-6">
          {(
            [
              { id: 'FOCUS', label: 'Focus' },
              { id: 'SHORT_BREAK', label: 'Short Break' },
              { id: 'LONG_BREAK', label: 'Long Break' },
            ] as { id: PomodoroPhase; label: string }[]
          ).map(phase => (
            <button
              key={phase.id}
              onClick={() => setPhase(phase.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                pomodoroPhase === phase.id
                  ? 'bg-purple-600/30 border-amber-400/40 text-amber-300 shadow-sm'
                  : 'bg-[#150f24] border-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {phase.label}
            </button>
          ))}
        </div>
      )}

      {/* Circular Timer Visualizer */}
      <div className="relative my-2 flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1b1230"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#timer-gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={timerMode === 'STOPWATCH' ? 0 : strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-linear"
          />
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Timer Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-extrabold tracking-tight text-white font-mono drop-shadow-md">
            {timerMode === 'STOPWATCH' ? formatTime(stopwatchSeconds) : formatTime(timeLeft)}
          </span>
          <span className="text-xs font-medium text-zinc-400 mt-2 flex items-center gap-1">
            {timerMode === 'POMODORO' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Phase: {pomodoroPhase.replace('_', ' ')} • #{pomodoroCount + 1}
              </>
            ) : timerMode === 'COUNTDOWN' ? (
              'Countdown Sprint'
            ) : (
              'Active Flow'
            )}
          </span>
        </div>
      </div>

      {/* Preset Buttons for Quick Adjustment */}
      {timerMode === 'COUNTDOWN' && (
        <div className="flex gap-2 my-4">
          {[10, 15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => handleSetCustomDuration(mins)}
              className="px-3 py-1 bg-[#18112c] hover:bg-purple-900/40 text-xs font-semibold text-zinc-300 hover:text-white rounded-lg border border-purple-500/20 transition-colors"
            >
              {mins}m
            </button>
          ))}
        </div>
      )}

      {/* Linked Habit Selector */}
      {habits.length > 0 && (
        <div className="w-full max-w-sm mt-4 p-3 bg-[#150f24] border border-purple-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeHabit?.icon || '⚡'}</span>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Associated Habit</p>
              <p className="text-xs font-semibold text-zinc-200 truncate max-w-[170px]">
                {activeHabit?.name || 'None selected'}
              </p>
            </div>
          </div>
          <select
            value={selectedHabitId}
            onChange={e => setSelectedHabitId(e.target.value)}
            className="bg-[#1f1538] text-xs text-purple-300 font-medium px-2 py-1.5 rounded-xl border border-purple-500/30 focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            <option value="">No habit</option>
            {sortedHabits.map(h => (
              <option key={h.id} value={h.id}>
                {h.icon} {h.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Primary Action Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={handleReset}
          className="p-3.5 rounded-full bg-[#18112c] hover:bg-[#251a44] text-zinc-400 hover:text-white border border-white/5 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleTogglePlay}
          className={`px-8 py-4 rounded-2xl flex items-center gap-2 font-bold text-base shadow-xl transition-all ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/25'
              : 'bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-purple-600/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Flow</span>
            </>
          )}
        </button>

        {timerMode === 'POMODORO' && (
          <button
            onClick={handleSkipPhase}
            className="p-3.5 rounded-full bg-[#18112c] hover:bg-[#251a44] text-zinc-400 hover:text-white border border-white/5 transition-colors"
            title="Skip phase"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Focus Daily Stats Summary */}
      <div className="w-full grid grid-cols-2 gap-3 mt-8">
        <div className="p-3.5 bg-[#140e24] border border-purple-500/15 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-950/60 text-purple-300 rounded-xl border border-purple-500/20">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{completedSessionsToday}</p>
            <p className="text-[11px] text-zinc-400">Sessions Finished</p>
          </div>
        </div>

        <div className="p-3.5 bg-[#140e24] border border-purple-500/15 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-purple-950/60 text-purple-300 rounded-xl border border-purple-500/20">
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{totalMinutesToday}m</p>
            <p className="text-[11px] text-zinc-400">Total Focus Time</p>
          </div>
        </div>
      </div>
    </div>
  );
};
