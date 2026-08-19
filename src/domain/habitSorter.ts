import { Habit, Routine, TimeOfDay } from '../types';

export const TIME_OF_DAY_ORDER: Record<TimeOfDay, number> = {
  MORNING: 1,
  AFTERNOON: 2,
  EVENING: 3,
  NIGHT: 4,
  ANYTIME: 5,
};

export const TIME_OF_DAY_DEFAULT_MINUTES: Record<TimeOfDay, number> = {
  MORNING: 8 * 60, // 08:00 AM (480 mins)
  AFTERNOON: 13 * 60, // 01:00 PM (780 mins)
  EVENING: 18 * 60, // 06:00 PM (1080 mins)
  NIGHT: 21 * 60 + 30, // 09:30 PM (1290 mins)
  ANYTIME: 23 * 60 + 59, // 11:59 PM (1439 mins)
};

/**
 * Calculates the chronological minutes from midnight (0 - 1439) for a habit.
 * If the habit has reminder times (e.g. ['07:30', '12:00']), it uses the earliest reminder time.
 * Otherwise, it falls back to the default representative time for its timeOfDay.
 */
export function getHabitChronologicalMinutes(habit: Habit): number {
  if (habit.reminderTimes && habit.reminderTimes.length > 0) {
    const validTimes = habit.reminderTimes
      .map(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          return h * 60 + m;
        }
        return null;
      })
      .filter((min): min is number => min !== null)
      .sort((a, b) => a - b);

    if (validTimes.length > 0) {
      return validTimes[0];
    }
  }

  return TIME_OF_DAY_DEFAULT_MINUTES[habit.timeOfDay] ?? TIME_OF_DAY_DEFAULT_MINUTES.ANYTIME;
}

/**
 * Sorts habits in ascending chronological order from Morning to Evening.
 */
export function sortHabitsAscending(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => {
    // 1. Compare chronological minutes (earliest time first)
    const timeA = getHabitChronologicalMinutes(a);
    const timeB = getHabitChronologicalMinutes(b);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // 2. Compare TimeOfDay rank (MORNING < AFTERNOON < EVENING < NIGHT < ANYTIME)
    const rankA = TIME_OF_DAY_ORDER[a.timeOfDay] ?? 5;
    const rankB = TIME_OF_DAY_ORDER[b.timeOfDay] ?? 5;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 3. Compare user-defined orderIndex
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }

    // 4. Fallback alphabetical sort by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sorts routines in ascending chronological order from Morning to Evening.
 */
export function sortRoutinesAscending(routines: Routine[]): Routine[] {
  return [...routines].sort((a, b) => {
    const rankA = TIME_OF_DAY_ORDER[a.timeOfDay] ?? 5;
    const rankB = TIME_OF_DAY_ORDER[b.timeOfDay] ?? 5;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return a.name.localeCompare(b.name);
  });
}

/**
 * Formats a display label for a habit's scheduled time.
 */
export function getHabitTimeDisplay(habit: Habit): string {
  if (habit.reminderTimes && habit.reminderTimes.length > 0) {
    return habit.reminderTimes.join(', ');
  }
  
  switch (habit.timeOfDay) {
    case 'MORNING':
      return 'Morning (8:00 AM)';
    case 'AFTERNOON':
      return 'Afternoon (1:00 PM)';
    case 'EVENING':
      return 'Evening (6:00 PM)';
    case 'NIGHT':
      return 'Night (9:30 PM)';
    case 'ANYTIME':
      return 'Anytime';
  }
}
