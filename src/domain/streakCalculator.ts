import { Habit, HabitCompletion, HabitCompletionStatus } from '../types';
import { formatLocalDate, parseLocalDate, addDays, getDaysDiff, isEligibleOn } from './recurrenceEngine';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate30d: number; // percentage 0 - 100
  freezesUsedThisWeek: number;
  freezesRemainingThisWeek: number;
  bestTimeOfDay?: string;
}

/**
 * Port of Android StreakCalculator.kt
 * Iterates through the habit's timeline, computing current & longest streaks
 * while honoring SKIPPED_EXCUSED as freezes without breaking streaks.
 */
export function calculateStreak(
  habit: Habit,
  completions: HabitCompletion[],
  referenceDate: Date = new Date()
): StreakStats {
  const habitCompletions = completions.filter(c => c.habitId === habit.id);
  const completionMap = new Map<string, HabitCompletionStatus>();
  const completionTimes: string[] = [];

  for (const c of habitCompletions) {
    completionMap.set(c.date, c.status);
    if (c.status === 'COMPLETED' && c.completedAt) {
      completionTimes.push(c.completedAt);
    }
  }

  const createdDate = parseLocalDate(habit.createdAt);
  const todayStr = formatLocalDate(referenceDate);
  const today = parseLocalDate(todayStr);

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  // Track weekly freezes (Monday-Sunday weeks)
  const currentWeekFreezes = countFreezesInCurrentWeek(habitCompletions, referenceDate);
  const freezeAllowance = habit.streakFreezeAllowance ?? 1;
  const freezesRemaining = Math.max(0, freezeAllowance - currentWeekFreezes);

  // Check if habit is on vacation/paused
  const isCurrentlyPaused = habit.pausedUntil && habit.pausedUntil >= todayStr;

  // Walk forward day by day from creation to yesterday/today
  const totalDays = Math.max(0, getDaysDiff(createdDate, today));
  
  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(createdDate, i);
    const dateStr = formatLocalDate(d);

    // Skip if day is before creation
    if (d < createdDate) continue;

    // Check if habit was paused on this date
    if (habit.pausedUntil && habit.pausedUntil >= dateStr && dateStr >= habit.createdAt) {
      // Paused days preserve running streak
      continue;
    }

    const eligible = isEligibleOn(habit.recurrenceRule, d, habit.createdAt);
    if (!eligible) {
      // Non-scheduled days simply continue the streak
      continue;
    }

    const status = completionMap.get(dateStr);

    if (status === 'COMPLETED') {
      runningStreak += 1;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (status === 'SKIPPED_EXCUSED') {
      // A freeze preserves current streak without adding to it
      // Running streak stays the same
    } else {
      // If it's today and not completed yet, the streak isn't broken yet!
      if (dateStr === todayStr) {
        // Today is pending, current streak remains the running streak up to yesterday
      } else {
        // Overdue/missed in the past breaks streak
        runningStreak = 0;
      }
    }
  }

  currentStreak = runningStreak;

  // Calculate 30-day completion rate
  let eligibleCount30d = 0;
  let completedCount30d = 0;

  for (let i = 0; i < 30; i++) {
    const d = addDays(today, -i);
    const dateStr = formatLocalDate(d);
    if (d < createdDate) break;

    const eligible = isEligibleOn(habit.recurrenceRule, d, habit.createdAt);
    if (eligible) {
      eligibleCount30d++;
      if (completionMap.get(dateStr) === 'COMPLETED') {
        completedCount30d++;
      }
    }
  }

  const completionRate30d = eligibleCount30d > 0
    ? Math.round((completedCount30d / eligibleCount30d) * 100)
    : (habitCompletions.some(c => c.status === 'COMPLETED') ? 100 : 0);

  // Derive best time of day
  let bestTimeOfDay = 'Morning';
  if (completionTimes.length > 0) {
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;

    for (const timeStr of completionTimes) {
      try {
        const hour = new Date(timeStr).getHours();
        if (hour >= 5 && hour < 12) morningCount++;
        else if (hour >= 12 && hour < 18) afternoonCount++;
        else eveningCount++;
      } catch {
        // ignore invalid dates
      }
    }

    if (afternoonCount > morningCount && afternoonCount > eveningCount) {
      bestTimeOfDay = 'Afternoon (12pm - 6pm)';
    } else if (eveningCount > morningCount && eveningCount >= afternoonCount) {
      bestTimeOfDay = 'Evening (6pm - 11pm)';
    } else {
      bestTimeOfDay = 'Morning (5am - 12pm)';
    }
  }

  const totalCompletions = habitCompletions.filter(c => c.status === 'COMPLETED').length;

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate30d,
    freezesUsedThisWeek: currentWeekFreezes,
    freezesRemainingThisWeek: freezesRemaining,
    bestTimeOfDay,
  };
}

function countFreezesInCurrentWeek(completions: HabitCompletion[], referenceDate: Date): number {
  // Monday of current week
  const curr = new Date(referenceDate);
  const day = curr.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = addDays(curr, diffToMonday);
  const sunday = addDays(monday, 6);

  const monStr = formatLocalDate(monday);
  const sunStr = formatLocalDate(sunday);

  return completions.filter(
    c => c.status === 'SKIPPED_EXCUSED' && c.date >= monStr && c.date <= sunStr
  ).length;
}
