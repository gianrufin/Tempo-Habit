import { Habit, HabitCompletion, Routine, Task, Goal, MoodRecord, UserPreferences } from '../types';
import { formatLocalDate, addDays } from '../domain/recurrenceEngine';

const STORAGE_KEYS = {
  HABITS: 'tempo_habits',
  COMPLETIONS: 'tempo_completions',
  ROUTINES: 'tempo_routines',
  TASKS: 'tempo_tasks',
  GOALS: 'tempo_goals',
  MOODS: 'tempo_moods',
  PREFS: 'tempo_prefs',
};

const todayStr = formatLocalDate(new Date());
const weekAgo = formatLocalDate(addDays(new Date(), -7));
const twoWeeksAgo = formatLocalDate(addDays(new Date(), -14));

const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Hydrate 2L Water',
    icon: '💧',
    color: '#38BDF8',
    category: 'Health',
    recurrenceRule: { type: 'DAILY' },
    timeOfDay: 'MORNING',
    createdAt: twoWeeksAgo,
    reminderTimes: ['08:00', '14:00'],
    streakFreezeAllowance: 2,
    graceDays: 0,
    routineId: 'routine-morning',
    orderIndex: 0,
  },
  {
    id: 'habit-2',
    name: 'Morning Meditation',
    icon: '🧘',
    color: '#10B981',
    category: 'Mindfulness',
    recurrenceRule: { type: 'DAILY' },
    timeOfDay: 'MORNING',
    createdAt: twoWeeksAgo,
    reminderTimes: ['07:30'],
    streakFreezeAllowance: 1,
    graceDays: 0,
    routineId: 'routine-morning',
    orderIndex: 1,
  },
  {
    id: 'habit-3',
    name: 'Read 15 Pages',
    icon: '📚',
    color: '#8B5CF6',
    category: 'Learning',
    recurrenceRule: { type: 'DAILY' },
    timeOfDay: 'EVENING',
    createdAt: twoWeeksAgo,
    reminderTimes: ['20:00'],
    streakFreezeAllowance: 1,
    graceDays: 0,
    routineId: 'routine-evening',
    orderIndex: 2,
  },
  {
    id: 'habit-4',
    name: 'Deep Work Sprint',
    icon: '⚡',
    color: '#EC4899',
    category: 'Productivity',
    recurrenceRule: { type: 'SPECIFIC_WEEKDAYS', weekdays: [1, 2, 3, 4, 5] },
    timeOfDay: 'MORNING',
    createdAt: twoWeeksAgo,
    reminderTimes: ['09:30'],
    streakFreezeAllowance: 2,
    graceDays: 0,
    routineId: null,
    orderIndex: 3,
  },
  {
    id: 'habit-5',
    name: 'Evening Stretch & Wind-down',
    icon: '🌙',
    color: '#6366F1',
    category: 'Health',
    recurrenceRule: { type: 'DAILY' },
    timeOfDay: 'NIGHT',
    createdAt: twoWeeksAgo,
    reminderTimes: ['21:30'],
    streakFreezeAllowance: 1,
    graceDays: 0,
    routineId: 'routine-evening',
    orderIndex: 4,
  },
];

const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'routine-morning',
    name: 'Rise & Energize',
    icon: '☀️',
    timeOfDay: 'MORNING',
    color: '#F59E0B',
    habitIds: ['habit-1', 'habit-2'],
  },
  {
    id: 'routine-evening',
    name: 'Evening Sanctuary',
    icon: '🌙',
    timeOfDay: 'EVENING',
    color: '#8B5CF6',
    habitIds: ['habit-3', 'habit-5'],
  },
];

// Seed some realistic completions over the last 14 days
function generateSeedCompletions(): HabitCompletion[] {
  const list: HabitCompletion[] = [];
  const habits = DEFAULT_HABITS;

  for (let d = 14; d >= 0; d--) {
    const dateStr = formatLocalDate(addDays(new Date(), -d));
    
    habits.forEach((h, idx) => {
      // Create an engaging streak history
      if (d === 0) {
        // Today: first 2 completed, rest pending
        if (idx < 2) {
          list.push({
            id: `comp-${h.id}-${dateStr}`,
            habitId: h.id,
            date: dateStr,
            status: 'COMPLETED',
            completedAt: `${dateStr}T08:15:00Z`,
          });
        }
      } else if (d === 4 && idx === 3) {
        // One freeze used
        list.push({
          id: `comp-${h.id}-${dateStr}`,
          habitId: h.id,
          date: dateStr,
          status: 'SKIPPED_EXCUSED',
        });
      } else if (d === 11 && idx === 4) {
        // Missed day
        list.push({
          id: `comp-${h.id}-${dateStr}`,
          habitId: h.id,
          date: dateStr,
          status: 'MISSED',
        });
      } else {
        // Completed
        list.push({
          id: `comp-${h.id}-${dateStr}`,
          habitId: h.id,
          date: dateStr,
          status: 'COMPLETED',
          completedAt: `${dateStr}T${idx % 2 === 0 ? '08:30:00' : '20:15:00'}Z`,
        });
      }
    });
  }
  return list;
}

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Review weekly project roadmap',
    isRecurring: false,
    dueDate: todayStr,
    priority: 'HIGH',
    checklist: [
      { id: 'c1', label: 'Check pending milestone deliverables', done: true },
      { id: 'c2', label: 'Sync priorities with sprint goals', done: false },
      { id: 'c3', label: 'Outline next week focus areas', done: false },
    ],
    notes: 'Keep alignment with quarterly targets',
    completed: false,
    createdAt: weekAgo,
    orderIndex: 0,
  },
  {
    id: 'task-2',
    title: 'Organize workspace & clean desk',
    isRecurring: true,
    recurrenceRule: { type: 'SPECIFIC_WEEKDAYS', weekdays: [5] }, // Fridays
    priority: 'MEDIUM',
    checklist: [
      { id: 'c4', label: 'Wipe down displays & keyboard', done: false },
      { id: 'c5', label: 'File away loose papers', done: false },
    ],
    notes: 'End the week with a fresh reset',
    completed: false,
    createdAt: twoWeeksAgo,
    orderIndex: 1,
  },
  {
    id: 'task-3',
    title: 'Backup database & personal archive',
    isRecurring: true,
    recurrenceRule: { type: 'MONTHLY_BY_DATE', monthlyDayOfMonth: 1 },
    priority: 'LOW',
    checklist: [],
    completed: true,
    completedAt: `${todayStr}T09:00:00Z`,
    createdAt: twoWeeksAgo,
    orderIndex: 2,
  },
];

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Complete 30 Days of Daily Mindfulness',
    linkedHabitId: 'habit-2',
    targetCompletions: 30,
    createdAt: twoWeeksAgo,
    rewardNote: 'Weekend retreat & special dinner',
  },
  {
    id: 'goal-2',
    title: 'Finish 3 Books (45 Reading Sessions)',
    linkedHabitId: 'habit-3',
    targetCompletions: 45,
    createdAt: twoWeeksAgo,
    rewardNote: 'New book haul from local bookstore',
  },
];

const DEFAULT_MOODS: MoodRecord[] = [
  { date: formatLocalDate(addDays(new Date(), -3)), mood: 4, updatedAt: new Date().toISOString() },
  { date: formatLocalDate(addDays(new Date(), -2)), mood: 5, updatedAt: new Date().toISOString() },
  { date: formatLocalDate(addDays(new Date(), -1)), mood: 4, updatedAt: new Date().toISOString() },
  { date: todayStr, mood: 5, updatedAt: new Date().toISOString() },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: 'Tempo Pioneer',
  soundChoice: 'Golden Hour',
  soundEnabled: true,
  vibrationEnabled: true,
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: true,
  theme: 'amoled',
  appVersion: '1.0.0',
  githubRepo: 'gianrufin/Tempo-Habit',
  autoCheckUpdates: true,
};

// Storage Helpers
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

export const StorageService = {
  getHabits: (): Habit[] => load(STORAGE_KEYS.HABITS, DEFAULT_HABITS),
  saveHabits: (habits: Habit[]) => save(STORAGE_KEYS.HABITS, habits),

  getCompletions: (): HabitCompletion[] => load(STORAGE_KEYS.COMPLETIONS, generateSeedCompletions()),
  saveCompletions: (completions: HabitCompletion[]) => save(STORAGE_KEYS.COMPLETIONS, completions),

  getRoutines: (): Routine[] => load(STORAGE_KEYS.ROUTINES, DEFAULT_ROUTINES),
  saveRoutines: (routines: Routine[]) => save(STORAGE_KEYS.ROUTINES, routines),

  getTasks: (): Task[] => load(STORAGE_KEYS.TASKS, DEFAULT_TASKS),
  saveTasks: (tasks: Task[]) => save(STORAGE_KEYS.TASKS, tasks),

  getGoals: (): Goal[] => load(STORAGE_KEYS.GOALS, DEFAULT_GOALS),
  saveGoals: (goals: Goal[]) => save(STORAGE_KEYS.GOALS, goals),

  getMoods: (): MoodRecord[] => load(STORAGE_KEYS.MOODS, DEFAULT_MOODS),
  saveMoods: (moods: MoodRecord[]) => save(STORAGE_KEYS.MOODS, moods),

  getPreferences: (): UserPreferences => load(STORAGE_KEYS.PREFS, DEFAULT_PREFERENCES),
  savePreferences: (prefs: UserPreferences) => save(STORAGE_KEYS.PREFS, prefs),

  exportFullBackupJson(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      habits: this.getHabits(),
      completions: this.getCompletions(),
      routines: this.getRoutines(),
      tasks: this.getTasks(),
      goals: this.getGoals(),
      moods: this.getMoods(),
      preferences: this.getPreferences(),
    };
    return JSON.stringify(data, null, 2);
  },

  importFullBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.habits) this.saveHabits(data.habits);
      if (data.completions) this.saveCompletions(data.completions);
      if (data.routines) this.saveRoutines(data.routines);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.goals) this.saveGoals(data.goals);
      if (data.moods) this.saveMoods(data.moods);
      if (data.preferences) this.savePreferences(data.preferences);
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  },

  exportHabitsCsv(): string {
    const habits = this.getHabits();
    const rows = ['name,icon,color,category,recurrence,timeOfDay'];
    habits.forEach(h => {
      let rec = 'DAILY';
      if (h.recurrenceRule.type === 'SPECIFIC_WEEKDAYS') {
        const days = (h.recurrenceRule.weekdays || []).map(d => {
          const map = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
          return map[d] || 'MON';
        }).join(',');
        rec = `WEEKDAYS:${days}`;
      } else if (h.recurrenceRule.type === 'EVERY_N_DAYS') {
        rec = `EVERY_N:${h.recurrenceRule.everyNDays || 2}`;
      } else if (h.recurrenceRule.type === 'TIMES_PER_WEEK') {
        rec = `TIMES_PER_WEEK:${h.recurrenceRule.timesPerWeek || 3}`;
      } else if (h.recurrenceRule.type === 'MONTHLY_BY_DATE') {
        rec = `MONTHLY:${h.recurrenceRule.monthlyDayOfMonth || 1}`;
      }
      rows.push(`"${h.name}","${h.icon}","${h.color}","${h.category || ''}","${rec}","${h.timeOfDay}"`);
    });
    return rows.join('\n');
  },

  resetToDefaults(): void {
    localStorage.clear();
  },
};
