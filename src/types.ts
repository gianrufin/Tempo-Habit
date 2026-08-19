export type HabitCompletionStatus = 'COMPLETED' | 'SKIPPED_EXCUSED' | 'MISSED';

export type RecurrenceType = 'DAILY' | 'SPECIFIC_WEEKDAYS' | 'EVERY_N_DAYS' | 'TIMES_PER_WEEK' | 'MONTHLY_BY_DATE';

export interface RecurrenceRule {
  type: RecurrenceType;
  weekdays?: number[]; // 1 = Monday, 7 = Sunday
  everyNDays?: number;
  timesPerWeek?: number;
  monthlyDayOfMonth?: number;
}

export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'ANYTIME';

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: HabitCompletionStatus;
  completedAt?: string; // ISO string with timestamp
  notes?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string; // Hex color (e.g. #9D4EDD)
  category?: string;
  recurrenceRule: RecurrenceRule;
  timeOfDay: TimeOfDay;
  createdAt: string; // YYYY-MM-DD
  reminderTimes: string[]; // ['08:00', '19:30']
  streakFreezeAllowance: number; // default 1 or 2 per week
  graceDays: number; // default 0
  pausedUntil?: string | null; // YYYY-MM-DD for vacation mode
  routineId?: string | null; // linked routine if any
  orderIndex: number;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  isRecurring: boolean;
  dueDate?: string; // YYYY-MM-DD (for one-off)
  recurrenceRule?: RecurrenceRule; // for recurring
  reminderTime?: string | null; // HH:mm
  priority: TaskPriority;
  checklist: TaskChecklistItem[];
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  orderIndex: number;
}

export interface Routine {
  id: string;
  name: string;
  icon: string;
  timeOfDay: TimeOfDay;
  color: string;
  habitIds: string[];
}

export interface Goal {
  id: string;
  title: string;
  linkedHabitId: string;
  targetCompletions: number;
  createdAt: string;
  completedAt?: string;
  rewardNote?: string;
}

export type MoodValue = 1 | 2 | 3 | 4 | 5; // 1: Awful, 2: Low, 3: Okay, 4: Good, 5: Great

export interface MoodRecord {
  date: string; // YYYY-MM-DD
  mood: MoodValue;
  note?: string;
  updatedAt: string;
}

export type TimerMode = 'POMODORO' | 'STOPWATCH' | 'COUNTDOWN';

export type PomodoroPhase = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

export interface AppReleaseInfo {
  version: string;
  tagName: string;
  name: string;
  body: string;
  publishedAt: string;
  downloadUrl: string;
  apkSizeMb?: number;
  isPreRelease?: boolean;
}

export interface UserPreferences {
  displayName: string;
  soundChoice: 'Golden Hour' | 'Aura Ping' | 'Crystal Fizz' | 'Velvet Pop' | 'Cloud Drift';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  focusDurationMinutes: number; // default 25
  shortBreakMinutes: number; // default 5
  longBreakMinutes: number; // default 15
  pomodorosUntilLongBreak: number; // default 4
  autoStartBreaks: boolean;
  theme: 'amoled' | 'dark' | 'light';
  appVersion?: string; // e.g. '1.0.0'
  githubRepo?: string; // e.g. 'gianrufin/Tempo-Habit'
  autoCheckUpdates?: boolean;
  lastUpdateCheckedAt?: string;
}

export interface HabitTemplate {
  name: string;
  icon: string;
  color: string;
  category: string;
  recurrenceRule: RecurrenceRule;
  timeOfDay: TimeOfDay;
  description: string;
}
