import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Format date to string using Spanish locale by default.
 *
 * When given a string, the timezone suffix is intentionally stripped before
 * parsing so that the displayed time matches exactly the wall-clock value that
 * was stored (no UTC ↔ local shift).
 * e.g. "2026-02-28T14:30:00+00:00" → shown as 14:30, not converted to local TZ.
 */
export function formatDate(date: Date | string, formatStr: string = 'dd MMM yyyy'): string {
  let dateObj: Date;
  if (typeof date === 'string') {
    let dStr = date.replace(' ', 'T');
    // If string lacks a timezone offset, treat it as UTC from the database
    if (!dStr.endsWith('Z') && !dStr.match(/[+-]\d{2}:?\d{2}$/)) {
      dStr += 'Z';
    }
    dateObj = new Date(dStr);
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) return '';
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Format date for input[type="date"]
 */
export function formatDateForInput(date: Date | string): string {
  let dateObj: Date;
  if (typeof date === 'string') {
    let dStr = date.replace(' ', 'T');
    if (!dStr.endsWith('Z') && !dStr.match(/[+-]\d{2}:?\d{2}$/)) {
      dStr += 'Z';
    }
    dateObj = new Date(dStr);
  } else {
    dateObj = date;
  }
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
