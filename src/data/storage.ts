import { Habit, HabitCompletion, Routine, Task, Goal, MoodRecord, UserPreferences } from '../types';
import { formatLocalDate } from '../domain/recurrenceEngine';

const STORAGE_KEYS = {
  HABITS: 'tempo_habits',
  COMPLETIONS: 'tempo_completions',
  ROUTINES: 'tempo_routines',
  TASKS: 'tempo_tasks',
  GOALS: 'tempo_goals',
  MOODS: 'tempo_moods',
  PREFS: 'tempo_prefs',
};

// Clean empty from-scratch initial datasets (Zero sample data)
const DEFAULT_HABITS: Habit[] = [];
const DEFAULT_ROUTINES: Routine[] = [];
const DEFAULT_TASKS: Task[] = [];
const DEFAULT_GOALS: Goal[] = [];
const DEFAULT_MOODS: MoodRecord[] = [];

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: 'Gian',
  soundChoice: 'Golden Hour',
  soundEnabled: true,
  vibrationEnabled: true,
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: false,
  theme: 'light',
  appVersion: '1.0.0',
  githubRepo: 'gianrufin/Tempo-Habit',
  autoCheckUpdates: true,
};

export const Storage = {
  getHabits(): Habit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!raw) return DEFAULT_HABITS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_HABITS;
    }
  },

  saveHabits(habits: Habit[]): void {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  getCompletions(): HabitCompletion[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCompletions(completions: HabitCompletion[]): void {
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
  },

  getRoutines(): Routine[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUTINES);
    if (!raw) return DEFAULT_ROUTINES;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_ROUTINES;
    }
  },

  saveRoutines(routines: Routine[]): void {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
  },

  getTasks(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return DEFAULT_TASKS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getGoals(): Goal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!raw) return DEFAULT_GOALS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_GOALS;
    }
  },

  saveGoals(goals: Goal[]): void {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  getMoods(): MoodRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOODS);
    if (!raw) return DEFAULT_MOODS;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_MOODS;
    }
  },

  saveMoods(moods: MoodRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.MOODS, JSON.stringify(moods));
  },

  getUserPreferences(): UserPreferences {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (!raw) return DEFAULT_PREFERENCES;
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  getPreferences(): UserPreferences {
    return this.getUserPreferences();
  },

  saveUserPreferences(prefs: UserPreferences): void {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
  },

  savePreferences(prefs: UserPreferences): void {
    this.saveUserPreferences(prefs);
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.COMPLETIONS);
    localStorage.removeItem(STORAGE_KEYS.ROUTINES);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.MOODS);
  },

  resetToDefaults(): void {
    this.clearAllData();
  },

  exportAllDataJSON(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      habits: this.getHabits(),
      completions: this.getCompletions(),
      routines: this.getRoutines(),
      tasks: this.getTasks(),
      goals: this.getGoals(),
      moods: this.getMoods(),
      preferences: this.getUserPreferences(),
    };
    return JSON.stringify(data, null, 2);
  },

  exportFullBackupJson(): string {
    return this.exportAllDataJSON();
  },

  exportHabitsCsv(): string {
    const habits = this.getHabits();
    const rows = ['ID,Name,Icon,Color,Category,TimeOfDay,CreatedAt'];
    habits.forEach(h => {
      rows.push(`"${h.id}","${h.name}","${h.icon}","${h.color}","${h.category || ''}","${h.timeOfDay}","${h.createdAt}"`);
    });
    return rows.join('\n');
  },

  importAllDataJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.habits)) this.saveHabits(parsed.habits);
      if (Array.isArray(parsed.completions)) this.saveCompletions(parsed.completions);
      if (Array.isArray(parsed.routines)) this.saveRoutines(parsed.routines);
      if (Array.isArray(parsed.tasks)) this.saveTasks(parsed.tasks);
      if (Array.isArray(parsed.goals)) this.saveGoals(parsed.goals);
      if (Array.isArray(parsed.moods)) this.saveMoods(parsed.moods);
      if (parsed.preferences && typeof parsed.preferences === 'object') {
        this.saveUserPreferences(parsed.preferences);
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  importFullBackupJson(jsonStr: string): boolean {
    return this.importAllDataJSON(jsonStr);
  },
};

export const StorageService = Storage;
