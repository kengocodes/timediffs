"use client";

import { Clock } from "lucide-react";
import { useTimezone } from "@/contexts/timezone-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Time format toggle component that allows users to switch between
 * 12-hour (AM/PM) and 24-hour time formats.
 * Matches the UI/UX style of other control components.
 */
export function TimeFormatToggle() {
  const { timeFormat, setTimeFormat } = useTimezone();

  const toggleFormat = () => {
    setTimeFormat(timeFormat === "12h" ? "24h" : "12h");
  };

  return (
    <Button
      variant="ghost"
      onClick={toggleFormat}
      className={cn(
        "h-11 w-11 lg:h-9 lg:w-auto lg:min-w-[100px] gap-1.5 lg:gap-2 rounded-lg lg:rounded-md text-sm font-medium text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 hover:bg-slate-100 dark:hover:bg-stone-800 lg:border lg:border-slate-300 dark:lg:border-stone-600 lg:bg-white dark:lg:bg-stone-900 lg:hover:bg-slate-50 dark:lg:hover:bg-stone-800 p-0 lg:px-4 shrink-0",
        "transition-colors"
      )}
      aria-label={`Switch to ${
        timeFormat === "12h" ? "24-hour" : "12-hour"
      } time format`}
      title={`Current format: ${
        timeFormat === "12h" ? "12-hour (AM/PM)" : "24-hour"
      }. Click to switch.`}
    >
      <Clock className="h-4 w-4 shrink-0 lg:block hidden" />
      <span className="text-xs lg:text-sm font-semibold">
        {timeFormat === "12h" ? "12H" : "24H"}
      </span>
    </Button>
  );
}
