import { RecurrenceRule } from '../types';

/**
 * Returns ISO Date string (YYYY-MM-DD) for a Date object in local timezone
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getDaysDiff(date1: Date, date2: Date): number {
  const ut1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const ut2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((ut2 - ut1) / (1000 * 60 * 60 * 24));
}

/**
 * Port of Android RecurrenceEngine.kt
 * Determines if a habit or recurring task is scheduled on a given date.
 */
export function isEligibleOn(rule: RecurrenceRule, date: Date, createdAt: string): boolean {
  const createdDate = parseLocalDate(createdAt);
  
  // A habit cannot be scheduled before it was created
  if (getDaysDiff(createdDate, date) < 0) {
    return false;
  }

  switch (rule.type) {
    case 'DAILY':
      return true;

    case 'SPECIFIC_WEEKDAYS': {
      if (!rule.weekdays || rule.weekdays.length === 0) return true;
      // JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      // ISO Day: 1 = Monday, ..., 7 = Sunday
      const jsDay = date.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;
      return rule.weekdays.includes(isoDay);
    }

    case 'EVERY_N_DAYS': {
      const interval = Math.max(1, rule.everyNDays || 1);
      const diff = getDaysDiff(createdDate, date);
      return diff % interval === 0;
    }

    case 'TIMES_PER_WEEK':
      // Times per week is considered eligible every day; repository checks completions cap
      return true;

    case 'MONTHLY_BY_DATE': {
      const targetDay = rule.monthlyDayOfMonth || 1;
      return date.getDate() === targetDay;
    }

    default:
      return true;
  }
}

export function formatRecurrenceRule(rule: RecurrenceRule): string {
  switch (rule.type) {
    case 'DAILY':
      return 'Every day';
    case 'SPECIFIC_WEEKDAYS': {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const selected = (rule.weekdays || []).map(d => dayNames[d - 1]).join(', ');
      return selected ? `On ${selected}` : 'No days selected';
    }
    case 'EVERY_N_DAYS':
      return `Every ${rule.everyNDays || 1} days`;
    case 'TIMES_PER_WEEK':
      return `${rule.timesPerWeek || 1}x / week`;
    case 'MONTHLY_BY_DATE':
      return `Day ${rule.monthlyDayOfMonth || 1} of month`;
    default:
      return 'Scheduled';
  }
}
