"use client";

import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Temporal } from "@/lib/temporal";
import { calendarGridDays } from "@/lib/calendar";
import { useTimezone } from "@/contexts/timezone-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Date picker component that displays a calendar for selecting dates.
 * Matches the UI/UX style of the TimezonePicker component.
 */
export function DatePicker() {
  const { selectedDate, setSelectedDate } = useTimezone();
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() =>
    selectedDate.toPlainYearMonth()
  );
  const isMobile = useIsMobile();

  // Get calendar days for the current month view
  const calendarDays = useMemo(
    () => calendarGridDays(currentMonth),
    [currentMonth]
  );

  const handleDateSelect = (date: Temporal.PlainDate) => {
    setSelectedDate(date);
    setOpen(false);
  };

  // Open on the month of the current selection, which may have changed
  // externally (week view, URL navigation) since the last open.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setCurrentMonth(selectedDate.toPlainYearMonth());
    }
    setOpen(nextOpen);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract({ months: 1 }));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add({ months: 1 }));
  };

  // Format via PlainDate: PlainYearMonth.toLocaleString throws
  // "Mismatched calendars" unless the locale's calendar matches ISO 8601
  const monthYearLabel = currentMonth
    .toPlainDate({ day: 1 })
    .toLocaleString("en-US", { month: "long", year: "numeric" });
  const today = Temporal.Now.plainDateISO();

  // Calendar content - shared between drawer and popover
  const calendarContent = (
    <div
      className={cn("p-4 lg:p-4", isMobile && "px-8 pt-10 pb-10 flex flex-col")}
    >
      {/* Month/Year Header with Navigation */}
      <div
        className={cn(
          "flex items-center justify-between",
          isMobile ? "mb-6" : "mb-4"
        )}
      >
        <button
          type="button"
          onClick={handlePreviousMonth}
          className={cn(
            "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 cursor-pointer",
            isMobile && "p-2"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        </button>
        <h3
          className={cn(
            "font-semibold text-slate-900 dark:text-stone-100",
            isMobile ? "text-lg" : "text-sm"
          )}
        >
          {monthYearLabel}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(
            "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 cursor-pointer",
            isMobile && "p-2"
          )}
          aria-label="Next month"
        >
          <ChevronRight className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
        </button>
      </div>

      {/* Day Names Header */}
      <div
        className={cn(
          "grid grid-cols-7 mb-1",
          isMobile ? "gap-2 mb-2" : "gap-1"
        )}
      >
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className={cn(
              "flex items-center justify-center font-semibold text-slate-600 dark:text-stone-400",
              isMobile ? "h-10 text-sm" : "h-8 text-xs"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={cn("grid grid-cols-7", isMobile ? "gap-2" : "gap-1")}>
        {calendarDays.map((day) => {
          const isCurrentMonth = day.toPlainYearMonth().equals(currentMonth);
          const isSelected = day.equals(selectedDate);
          const isToday = day.equals(today);

          return (
            <button
              type="button"
              key={day.toString()}
              onClick={() => handleDateSelect(day)}
              className={cn(
                "flex items-center justify-center rounded-md transition-colors cursor-pointer",
                isMobile
                  ? "h-12 w-full text-base font-medium"
                  : "h-9 w-9 text-sm",
                isCurrentMonth
                  ? "text-slate-900 dark:text-stone-100"
                  : "text-slate-400 dark:text-stone-600",
                isSelected
                  ? "bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium hover:bg-slate-800 dark:hover:bg-stone-200"
                  : isToday
                  ? "bg-slate-100 dark:bg-stone-800 text-slate-900 dark:text-stone-100 font-medium hover:bg-slate-200 dark:hover:bg-stone-700"
                  : "hover:bg-slate-200 dark:hover:bg-stone-700"
              )}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );

  const triggerButton = (
    <Button
      variant="outline"
      className="h-11 w-full lg:h-9 lg:min-w-[120px] lg:w-auto gap-2 lg:gap-2 rounded-xl lg:rounded-md border-slate-200 dark:border-stone-700 lg:border-slate-300 dark:lg:border-stone-600 bg-slate-50 dark:bg-stone-800 lg:bg-white dark:lg:bg-stone-900 text-sm font-medium text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-700 lg:hover:bg-slate-50 dark:lg:hover:bg-stone-800 px-4 lg:px-4 shrink-0 justify-start lg:justify-center"
    >
      <Calendar className="h-4 w-4 shrink-0 text-slate-500 dark:text-stone-400" />
      <span className="font-semibold">
        {selectedDate.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </span>
    </Button>
  );

  // Use Drawer on mobile, Popover on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="p-0" open={open}>
          {calendarContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 shadow-sm"
        align="start"
      >
        {calendarContent}
      </PopoverContent>
    </Popover>
  );
}
