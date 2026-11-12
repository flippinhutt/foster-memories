import { differenceInCalendarDays, format, isValid, parse, parseISO } from 'date-fns';

/** Dates are shown and typed as MM-DD-YYYY; stored as ISO YYYY-MM-DD. */
const DISPLAY_FORMAT = 'MM-dd-yyyy';
const DISPLAY_PATTERN = /^\d{2}-\d{2}-\d{4}$/;

/** Parses a strict MM-DD-YYYY string into a local date, or null if not a real date. */
export function parseDisplayDate(value: string): Date | null {
  if (!DISPLAY_PATTERN.test(value)) return null;
  const date = parse(value, DISPLAY_FORMAT, new Date());
  return isValid(date) && format(date, DISPLAY_FORMAT) === value ? date : null;
}

export function toDisplayDate(date: Date): string {
  return format(date, DISPLAY_FORMAT);
}

/** ISO YYYY-MM-DD -> MM-DD-YYYY. */
export function formatDate(isoDate: string): string {
  return toDisplayDate(parseISO(isoDate));
}

/** MM-DD-YYYY -> ISO YYYY-MM-DD. Throws on an invalid date. */
export function displayToIsoDate(value: string): string {
  const date = parseDisplayDate(value);
  if (!date) throw new Error(`Invalid date: ${value}`);
  return format(date, 'yyyy-MM-dd');
}

/** Days in care, counting arrival day as day 1. Null without an arrival date. */
export function daysInCare(
  arrivalDate: string | null,
  departureDate: string | null,
  now: Date = new Date(),
): number | null {
  if (!arrivalDate) return null;
  const end = departureDate ? parseISO(departureDate) : now;
  const days = differenceInCalendarDays(end, parseISO(arrivalDate)) + 1;
  return days > 0 ? days : null;
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
