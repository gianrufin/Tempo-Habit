import React, { useState, useEffect, useRef } from 'react';
import { Habit, TimerMode, PomodoroPhase, UserPreferences } from '../types';
import { playSound, playCelebrationSound, triggerVibration } from '../audio/soundPlayer';
import { TimerEngine, ActiveTimerState } from '../domain/timerEngine';
import { sortHabitsAscending } from '../domain/habitSorter';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Flame,
  Timer,
  Zap,
  Sliders,
  Bell,
  Clock,
} from 'lucide-react';
import { SquircleIcon } from '../components/SquircleIcon';
import { TimerAlarmSplash } from '../components/Modals/TimerAlarmSplash';
import { MaterialTimePicker } from '../components/Modals/MaterialTimePicker';

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

  // Duration setups
  const focusSeconds = (userPrefs.focusDurationMinutes || 25) * 60;
  const shortBreakSeconds = (userPrefs.shortBreakMinutes || 5) * 60;
  const longBreakSeconds = (userPrefs.longBreakMinutes || 15) * 60;

  const [timeLeft, setTimeLeft] = useState<number>(focusSeconds);
  const [totalDuration, setTotalDuration] = useState<number>(focusSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);

  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(userPrefs.soundEnabled ?? true);
  const [completedSessionsToday, setCompletedSessionsToday] = useState<number>(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState<number>(0);

  // Alarm Splash Modal & Time Picker Modals
  const [alarmSplashOpen, setAlarmSplashOpen] = useState(false);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore stored active timer if window was closed or reloaded
  useEffect(() => {
    const saved = TimerEngine.getStoredState();
    if (saved) {
      setTimerMode(saved.mode);
      setPomodoroPhase(saved.phase);
      setPomodoroCount(saved.pomodoroCount || 0);
      setTotalDuration(saved.totalDurationSeconds || focusSeconds);
      if (saved.selectedHabitId) setSelectedHabitId(saved.selectedHabitId);

      const check = TimerEngine.calculateCurrentRemaining(saved);
      if (saved.isRunning) {
        if (check.isFinished) {
          // Timer finished while user was away!
          setTimeLeft(0);
          setIsRunning(false);
          setTargetEndTime(null);
          setAlarmSplashOpen(true);
          TimerEngine.clearState();
        } else {
          setTimeLeft(check.remainingSeconds);
          setIsRunning(true);
          setTargetEndTime(saved.targetEndTime);
        }
      } else {
        setTimeLeft(saved.remainingSeconds);
        setIsRunning(false);
      }
    }
  }, []);

  // Save active timer whenever state changes
  useEffect(() => {
    if (isRunning && targetEndTime) {
      const state: ActiveTimerState = {
        mode: timerMode,
        phase: pomodoroPhase,
        targetEndTime,
        totalDurationSeconds: totalDuration,
        remainingSeconds: timeLeft,
        isRunning: true,
        startedAt: Date.now(),
        selectedHabitId,
        pomodoroCount,
      };
      TimerEngine.saveState(state);
    } else if (!isRunning) {
      TimerEngine.clearState();
    }
  }, [isRunning, targetEndTime, timeLeft, timerMode, pomodoroPhase, selectedHabitId, pomodoroCount, totalDuration]);

  // Phase changer for Pomodoro
  const setPhase = (phase: PomodoroPhase) => {
    setIsRunning(false);
    setTargetEndTime(null);
    setPomodoroPhase(phase);
    let dur = focusSeconds;
    if (phase === 'SHORT_BREAK') dur = shortBreakSeconds;
    if (phase === 'LONG_BREAK') dur = longBreakSeconds;
    setTotalDuration(dur);
    setTimeLeft(dur);
  };

  // Switch modes
  const handleSwitchMode = (mode: TimerMode) => {
    setIsRunning(false);
    setTargetEndTime(null);
    setTimerMode(mode);
    if (mode === 'POMODORO') {
      setPhase('FOCUS');
    } else if (mode === 'COUNTDOWN') {
      setTotalDuration(focusSeconds);
      setTimeLeft(focusSeconds);
    } else if (mode === 'STOPWATCH') {
      setStopwatchSeconds(0);
    }
  };

  // Timer Tick Mechanism (With timestamp synchronization for background resilience)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (timerMode === 'STOPWATCH') {
          setStopwatchSeconds(prev => prev + 1);
        } else {
          if (targetEndTime) {
            const now = Date.now();
            const diff = Math.round((targetEndTime - now) / 1000);
            if (diff <= 0) {
              setTimeLeft(0);
              handleTimerCompleted();
            } else {
              setTimeLeft(diff);
            }
          } else {
            setTimeLeft(prev => {
              if (prev <= 1) {
                handleTimerCompleted();
                return 0;
              }
              return prev - 1;
            });
          }
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, targetEndTime, timerMode]);

  const handleStartTimer = () => {
    const end = Date.now() + timeLeft * 1000;
    setTargetEndTime(end);
    setIsRunning(true);
    triggerVibration([100, 50, 100]);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    triggerVibration([80]);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    TimerEngine.clearState();

    if (timerMode === 'STOPWATCH') {
      setStopwatchSeconds(0);
    } else if (timerMode === 'POMODORO') {
      setPhase(pomodoroPhase);
    } else {
      setTimeLeft(totalDuration);
    }
  };

  const handleTimerCompleted = () => {
    setIsRunning(false);
    setTargetEndTime(null);
    TimerEngine.clearState();

    // Trigger Android-style Fullscreen Ringing Alarm Splash
    setAlarmSplashOpen(true);

    // Send system notification
    const habitObj = sortedHabits.find(h => h.id === selectedHabitId);
    const title = timerMode === 'POMODORO' ? `${pomodoroPhase} Session Complete!` : 'Tempo Timer Finished!';
    const body = habitObj ? `Great job on ${habitObj.name}!` : 'Your focus interval has elapsed.';
    TimerEngine.sendSystemNotification(title, body);

    if (timerMode === 'POMODORO') {
      if (pomodoroPhase === 'FOCUS') {
        const nextCount = pomodoroCount + 1;
        setPomodoroCount(nextCount);
        setCompletedSessionsToday(prev => prev + 1);
        setTotalMinutesToday(prev => prev + Math.round(totalDuration / 60));

        if (selectedHabitId && onCompleteHabit) {
          onCompleteHabit(selectedHabitId);
        }
      }
    } else if (timerMode === 'COUNTDOWN') {
      setCompletedSessionsToday(prev => prev + 1);
      setTotalMinutesToday(prev => prev + Math.round(totalDuration / 60));
      if (selectedHabitId && onCompleteHabit) {
        onCompleteHabit(selectedHabitId);
      }
    }
  };

  const handleAlarmSplashDismiss = () => {
    setAlarmSplashOpen(false);
    if (timerMode === 'POMODORO') {
      if (pomodoroPhase === 'FOCUS') {
        const untilLong = userPrefs.pomodorosUntilLongBreak || 4;
        if (pomodoroCount > 0 && pomodoroCount % untilLong === 0) {
          setPhase('LONG_BREAK');
        } else {
          setPhase('SHORT_BREAK');
        }
      } else {
        setPhase('FOCUS');
      }
    } else {
      setTimeLeft(totalDuration);
    }
  };

  const handleStartBreakFromSplash = () => {
    setAlarmSplashOpen(false);
    setPhase('SHORT_BREAK');
    setTimeout(() => handleStartTimer(), 400);
  };

  const handleSnoozeFromSplash = () => {
    setAlarmSplashOpen(false);
    setTimeLeft(5 * 60);
    setTotalDuration(5 * 60);
    setTimeout(() => handleStartTimer(), 400);
  };

  // Format MM:SS or HH:MM:SS
  const formatTimeDisplay = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentSeconds = timerMode === 'STOPWATCH' ? stopwatchSeconds : timeLeft;
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = 754 - 754 * (timerMode === 'STOPWATCH' ? 1 : progressRatio);

  const selectedHabit = sortedHabits.find(h => h.id === selectedHabitId);

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6 animate-fade-in pb-28">
      {/* 1. Top Mode Selector */}
      <div className="flex items-center justify-center">
        <div className="p-1 rounded-2xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 flex gap-1 shadow-sm">
          {(['POMODORO', 'COUNTDOWN', 'STOPWATCH'] as TimerMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSwitchMode(mode)}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timerMode === mode
                  ? 'bg-[#7C69EF] text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {mode.charAt(0) + mode.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Pomodoro Phase Selector */}
      {timerMode === 'POMODORO' && (
        <div className="flex items-center justify-center gap-2">
          {(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'] as PomodoroPhase[]).map(phase => {
            const isSelected = pomodoroPhase === phase;
            return (
              <button
                key={phase}
                type="button"
                onClick={() => setPhase(phase)}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-[#7C69EF] dark:text-purple-300 ring-1 ring-[#7C69EF]'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                {phase === 'FOCUS' && 'Focus (25m)'}
                {phase === 'SHORT_BREAK' && 'Short Break (5m)'}
                {phase === 'LONG_BREAK' && 'Long Break (15m)'}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Circular Timer Hero Display */}
      <div className="relative flex items-center justify-center py-4">
        {/* Glow Ring Behind */}
        {isRunning && (
          <div className="absolute w-72 h-72 rounded-full bg-[#7C69EF]/20 blur-3xl animate-radial-pulse" />
        )}

        <div className="relative w-72 h-72 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
            {/* Background Circle */}
            <circle
              cx="130"
              cy="130"
              r="120"
              className="stroke-purple-100 dark:stroke-[#1f1638]"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="130"
              cy="130"
              r="120"
              stroke="#7C69EF"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="754"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Digital Clock Display */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-5xl sm:text-6xl font-black tracking-tight font-mono text-zinc-900 dark:text-white drop-shadow-sm">
              {formatTimeDisplay(currentSeconds)}
            </span>

            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 pt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {timerMode === 'POMODORO' ? pomodoroPhase : timerMode}
              </span>
            </div>

            {timerMode === 'POMODORO' && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 pt-1">
                <span>Cycle #{pomodoroCount + 1}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Timer Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleResetTimer}
          className="p-4 rounded-2xl bg-white dark:bg-[#161026] text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-black/5 dark:border-white/5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={isRunning ? handlePauseTimer : handleStartTimer}
          className={`py-4 px-10 rounded-3xl font-bold text-base flex items-center gap-2.5 shadow-xl transition-all active:scale-95 cursor-pointer ${
            isRunning
              ? 'bg-[#FF8522] hover:bg-[#eb7413] text-white shadow-orange-900/20'
              : 'bg-[#7C69EF] hover:bg-[#6c59db] text-white shadow-purple-900/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-6 h-6 fill-white" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-white" />
              <span>Start Chamber</span>
            </>
          )}
        </button>

        {timerMode === 'POMODORO' && (
          <button
            type="button"
            onClick={handleTimerCompleted}
            className="p-4 rounded-2xl bg-white dark:bg-[#161026] text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-black/5 dark:border-white/5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Skip to Next"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 5. Custom Presets & Material Time Picker Trigger */}
      {timerMode === 'COUNTDOWN' && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {[10, 15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                setIsRunning(false);
                setTotalDuration(mins * 60);
                setTimeLeft(mins * 60);
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-purple-100 dark:hover:bg-purple-950 hover:text-[#7C69EF] transition-all cursor-pointer"
            >
              {mins}m
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomPickerOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-[#7C69EF] dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>
      )}

      {/* 6. Linked Habit Attachment Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Link to Habit
          </span>
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            Auto-completes upon timer finish
          </span>
        </div>

        {sortedHabits.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">
            No habits created yet. Focus time will be recorded in general chamber stats.
          </p>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {sortedHabits.map(h => {
              const isSelected = selectedHabitId === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHabitId(h.id)}
                  className={`p-2 rounded-2xl border flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-[#22183c] border-[#7C69EF] text-zinc-900 dark:text-white shadow-sm'
                      : 'bg-zinc-50 dark:bg-[#1f1638] border-black/5 dark:border-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <SquircleIcon name={h.icon} color={h.color} size="xs" variant="soft" />
                  <span className="text-xs font-bold truncate max-w-[120px]">{h.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Daily Momentum Bento Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Focus Sprints Today
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white">
              {completedSessionsToday}
            </span>
            <span className="text-xs text-zinc-400 font-semibold">completed</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#161026] border border-black/5 dark:border-white/5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Focus Time
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#FF8522]">
              {totalMinutesToday}
            </span>
            <span className="text-xs text-zinc-400 font-semibold">minutes</span>
          </div>
        </div>
      </div>

      {/* 8. Fullscreen Alarm Splash Screen */}
      <TimerAlarmSplash
        isOpen={alarmSplashOpen}
        habit={selectedHabit}
        phaseLabel={timerMode === 'POMODORO' ? `${pomodoroPhase} Sprint` : 'Timer'}
        durationMinutes={Math.round(totalDuration / 60)}
        userPrefs={userPrefs}
        onDismiss={handleAlarmSplashDismiss}
        onStartBreak={timerMode === 'POMODORO' ? handleStartBreakFromSplash : undefined}
        onSnooze={handleSnoozeFromSplash}
      />

      {/* 9. Material 3 Time Picker Dialog */}
      <MaterialTimePicker
        isOpen={customPickerOpen}
        initialTime="00:25"
        title="Set Focus Duration"
        onClose={() => setCustomPickerOpen(false)}
        onSelectTime={timeStr => {
          const parts = timeStr.split(':');
          const mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
          const finalMins = Math.max(1, mins);
          setTotalDuration(finalMins * 60);
          setTimeLeft(finalMins * 60);
        }}
      />
    </div>
  );
};
