"use client";

import { Temporal } from "@/lib/temporal";
import { startOfWeekSunday, eachDayInRange } from "@/lib/calendar";
import { useTimezone } from "@/contexts/timezone-context";
import { cn } from "@/lib/utils";

/**
 * Week view component that displays the current week's dates (Sunday to Saturday) as quick action buttons.
 * Shows indicators for today and the selected date.
 * The week view always shows the current week (this week) for quick access.
 */
export function WeekView() {
  const { selectedDate, setSelectedDate } = useTimezone();

  const today = Temporal.Now.plainDateISO();

  // Current week (Sunday-Saturday) containing today; cheap enough to
  // recompute per render, so no manual memoization
  const weekStart = startOfWeekSunday(today);
  const weekDays = eachDayInRange(weekStart, weekStart.add({ days: 6 }));

  return (
    <div className="flex items-center gap-1 lg:gap-1 overflow-x-auto pb-1 -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-hide shrink-0">
      {weekDays.map((day) => {
        const isSelected = day.equals(selectedDate);
        const isToday = day.equals(today);
        const dayName = day.toLocaleString("en-US", { weekday: "short" });
        const fullLabel = day.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        return (
          <button
            key={day.toString()}
            onClick={() => setSelectedDate(day)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[40px] lg:min-w-[40px] h-9 px-1 lg:px-1.5 rounded-md transition-colors cursor-pointer shrink-0",
              "text-xs font-medium",
              isSelected
                ? "bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-slate-800 dark:hover:bg-stone-200"
                : isToday
                ? "bg-slate-100 dark:bg-stone-800 text-slate-900 dark:text-stone-100 hover:bg-slate-200 dark:hover:bg-stone-700"
                : "text-slate-600 dark:text-stone-400 hover:bg-slate-200 dark:hover:bg-stone-700"
            )}
            aria-label={`Select ${fullLabel}`}
            title={fullLabel}
          >
            <span className="text-[10px] leading-tight opacity-75">
              {dayName}
            </span>
            <span className="text-sm leading-tight font-semibold">
              {day.day}
            </span>
          </button>
        );
      })}
    </div>
  );
}
