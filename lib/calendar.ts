import { Temporal } from "@/lib/temporal";

/**
 * Calendar-grid helpers shared by the date picker and week view.
 * All functions operate on Temporal.PlainDate with Sunday-based weeks.
 */

/** Returns the Sunday on or before the given date. */
export function startOfWeekSunday(date: Temporal.PlainDate): Temporal.PlainDate {
  // dayOfWeek is ISO: Monday = 1 ... Sunday = 7
  return date.subtract({ days: date.dayOfWeek % 7 });
}

/** Returns every date from start to end, inclusive. */
export function eachDayInRange(
  start: Temporal.PlainDate,
  end: Temporal.PlainDate
): Temporal.PlainDate[] {
  const days: Temporal.PlainDate[] = [];
  for (
    let day = start;
    Temporal.PlainDate.compare(day, end) <= 0;
    day = day.add({ days: 1 })
  ) {
    days.push(day);
  }
  return days;
}

/**
 * Returns the full calendar grid for a month: whole weeks (Sunday-Saturday)
 * covering the first through last day of the month.
 */
export function calendarGridDays(
  month: Temporal.PlainYearMonth
): Temporal.PlainDate[] {
  const monthStart = month.toPlainDate({ day: 1 });
  const monthEnd = month.toPlainDate({ day: month.daysInMonth });
  const gridStart = startOfWeekSunday(monthStart);
  const gridEnd = startOfWeekSunday(monthEnd).add({ days: 6 });
  return eachDayInRange(gridStart, gridEnd);
}
