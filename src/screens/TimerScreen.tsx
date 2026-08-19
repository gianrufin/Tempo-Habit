import React, { useState, useEffect, useRef } from 'react';
import { Habit, TimerMode, PomodoroPhase, UserPreferences } from '../types';
import { playSound, playCelebrationSound } from '../audio/soundPlayer';
import { sortHabitsAscending } from '../domain/habitSorter';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Sparkles, CheckCircle2, Flame, Timer, Zap } from 'lucide-react';
import { SquircleIcon } from '../components/SquircleIcon';

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
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState<number>(0);

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

        if (selectedHabitId && onCompleteHabit) {
          onCompleteHabit(selectedHabitId);
        }

        if (nextCount % (userPrefs.pomodorosUntilLongBreak || 4) === 0) {
          setPhase('LONG_BREAK');
        } else {
          setPhase('SHORT_BREAK');
        }
      } else {
        setPhase('FOCUS');
      }
    }
  };

  const toggleStartPause = () => {
    setIsRunning(prev => !prev);
    if (!isRunning && soundEnabled) {
      playSound(userPrefs.soundChoice, 0.3);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerMode === 'STOPWATCH') {
      setStopwatchSeconds(0);
    } else {
      setTimeLeft(totalDuration);
    }
  };

  const handleSkip = () => {
    if (timerMode === 'POMODORO') {
      if (pomodoroPhase === 'FOCUS') {
        setPhase('SHORT_BREAK');
      } else {
        setPhase('FOCUS');
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    timerMode === 'STOPWATCH'
      ? 100
      : Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-28 space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Focus Chamber
          </h2>
          <p className="text-xs text-zinc-400">Deep work and habit interval timer</p>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled(prev => !prev)}
          className={`p-2.5 rounded-2xl border transition-colors ${
            soundEnabled
              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 border-purple-300/40'
              : 'bg-white dark:bg-[#161026] text-zinc-400 border-black/5 dark:border-white/5'
          }`}
          title={soundEnabled ? 'Sound Enabled' : 'Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#161026] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
        {(['POMODORO', 'STOPWATCH', 'COUNTDOWN'] as TimerMode[]).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setTimerMode(mode)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timerMode === mode
                ? 'bg-[#7C69EF] text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            {mode === 'POMODORO' ? 'Pomodoro' : mode === 'STOPWATCH' ? 'Stopwatch' : 'Countdown'}
          </button>
        ))}
      </div>

      {/* Timer Circular Display Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 shadow-md flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        {/* Linked Habit Picker */}
        {sortedHabits.length > 0 && (
          <div className="w-full max-w-xs">
            <select
              value={selectedHabitId}
              onChange={e => setSelectedHabitId(e.target.value)}
              className="w-full text-xs font-semibold py-2 px-3 rounded-2xl bg-purple-50 dark:bg-[#1f1638] border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 outline-none"
            >
              <option value="">No linked habit</option>
              {sortedHabits.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.timeOfDay})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Big Time Display */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-zinc-900 dark:text-white">
            {timerMode === 'STOPWATCH' ? formatTime(stopwatchSeconds) : formatTime(timeLeft)}
          </div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mt-2">
            {timerMode === 'POMODORO' ? pomodoroPhase.replace('_', ' ') : timerMode}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-all cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={toggleStartPause}
            className="px-8 py-3.5 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-purple-900/30 active:scale-95 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white ml-0.5" />
                <span>Start</span>
              </>
            )}
          </button>

          {timerMode === 'POMODORO' && (
            <button
              type="button"
              onClick={handleSkip}
              className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-all cursor-pointer"
              title="Skip Phase"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Bento Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Completed Cycles
          </span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            {completedSessionsToday}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Pomodoro sessions</p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 space-y-1 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Total Focus Time
          </span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            {totalMinutesToday}m
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">Recorded today</p>
        </div>
      </div>
    </div>
  );
};
