import { TimerMode, PomodoroPhase } from '../types';
import { startTimerAlarmLoop, stopTimerAlarmLoop, playCelebrationSound } from '../audio/soundPlayer';

export interface ActiveTimerState {
  mode: TimerMode;
  phase: PomodoroPhase;
  targetEndTime: number | null; // ms timestamp when timer completes
  totalDurationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  startedAt: number;
  selectedHabitId: string;
  pomodoroCount: number;
}

const TIMER_STORAGE_KEY = 'tempo_active_timer_state';

export const TimerEngine = {
  getStoredState(): ActiveTimerState | null {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveState(state: ActiveTimerState): void {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  },

  clearState(): void {
    try {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch (_) {}
  },

  /**
   * Calculates current remaining seconds accurately based on target timestamp.
   * If window was closed, this accurately reflects elapsed time.
   */
  calculateCurrentRemaining(state: ActiveTimerState): {
    remainingSeconds: number;
    isFinished: boolean;
  } {
    if (!state.isRunning || !state.targetEndTime) {
      return {
        remainingSeconds: state.remainingSeconds,
        isFinished: state.remainingSeconds <= 0 && state.isRunning,
      };
    }

    const now = Date.now();
    const diffSeconds = Math.round((state.targetEndTime - now) / 1000);

    if (diffSeconds <= 0) {
      return {
        remainingSeconds: 0,
        isFinished: true,
      };
    }

    return {
      remainingSeconds: diffSeconds,
      isFinished: false,
    };
  },

  sendSystemNotification(title: string, body: string): void {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="28" fill="%237C69EF"/><path d="M55 20 L30 55 L48 55 L42 80 L70 45 L52 45 Z" fill="white"/></svg>',
          requireInteraction: true,
        });
      }
    } catch (_) {}
  },
};
