"use client";

import { X, Home, GripVertical, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Temporal } from "@/lib/temporal";
import type { TimezoneDisplay } from "@/types";
import { HourCell } from "./hour-cell";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useTimezone } from "@/contexts/timezone-context";

interface TimezoneRowProps {
  display: TimezoneDisplay;
  holidayName?: string;
  referenceHours: Temporal.ZonedDateTime[];
  onRemove: (timezoneId: string) => void;
  onSetHome: (timezoneId: string) => void;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  isEditMode?: boolean;
  highlightedColumnIndex?: number | null;
  centerColumnIndex?: number | null;
  currentHourIndex?: number | null;
  referenceTimezoneId?: string;
}

/**
 * Renders a single timezone row with controls and timeline visualization.
 */
export function TimezoneRow({
  display,
  holidayName,
  referenceHours,
  onRemove,
  onSetHome,
  dragHandleProps,
  isDragging = false,
  isEditMode = false,
  highlightedColumnIndex = null,
  centerColumnIndex = null,
  currentHourIndex = null,
  referenceTimezoneId,
}: TimezoneRowProps) {
  const isMobile = useIsMobile();
  const { isViewingToday } = useTimezone();
  const fullLocationLabel = display.timezone.country
    ? holidayName
      ? `${display.timezone.country} · ${holidayName}`
      : display.timezone.country
    : holidayName ?? "";

  // The current hour column is shared by all rows (the timeline is anchored
  // to the reference timezone), so use the index computed by the parent.
  // Only highlight when viewing today with a known reference timezone.
  const currentHourIndexForRow =
    isViewingToday && referenceTimezoneId ? currentHourIndex : null;
  return (
    <div>
      <div
        className={cn(
          "group relative flex flex-col lg:flex-row items-stretch lg:min-h-[38px] lg:pt-0.5 lg:rounded-md gap-1",
          // Must be overflow-visible to allow horizontal scrolling on mobile
          "overflow-visible",
          // Mobile: subtle card-like appearance (background removed to avoid overlap with info section)
          "lg:bg-transparent",
          "rounded-2xl lg:rounded-md",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:shadow-none",
          "border border-slate-100 dark:border-stone-800 lg:border-0",
          // When dragging, always show background on mobile to ensure visibility
          isDragging && [
            "bg-white dark:bg-stone-900",
            "shadow-lg shadow-slate-900/10 dark:shadow-stone-950/30"
          ]
        )}
      >
        {/* Control Buttons Group */}
        <div
          className={cn("hidden lg:flex items-center gap-1 shrink-0 lg:mr-3")}
        >
          {/* Drag Handle */}
          <button
            className={cn(
              "flex items-center justify-center h-11 w-11 lg:h-7 lg:w-7 rounded-md text-slate-400 dark:text-stone-500 transition-colors hover:text-slate-600 dark:hover:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-stone-500"
            )}
            aria-label={`Reorder ${display.timezone.city}`}
            {...dragHandleProps}
          >
            <GripVertical className="h-5 w-5 lg:h-3.5 lg:w-3.5" />
          </button>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(display.timezone.id)}
            className="flex items-center justify-center h-11 w-11 lg:h-7 lg:w-7 rounded-md text-slate-500 dark:text-stone-400 transition-colors hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-stone-500"
            aria-label={`Remove ${display.timezone.city}`}
          >
            <X className="h-5 w-5 lg:h-3.5 lg:w-3.5" />
          </button>

          {/* Home Button */}
          <button
            onClick={() => onSetHome(display.timezone.id)}
            className={cn(
              "flex items-center justify-center h-11 w-11 lg:h-7 lg:w-7 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-stone-500",
              display.timezone.isHome
                ? "text-slate-700 dark:text-stone-300"
                : "text-slate-400 dark:text-stone-500 hover:text-slate-600 dark:hover:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800"
            )}
            aria-label={
              display.timezone.isHome
                ? `${display.timezone.city} is the home timezone`
                : `Set ${display.timezone.city} as home timezone`
            }
          >
            <Home
              className={cn(
                "h-5 w-5 lg:h-3.5 lg:w-3.5",
                display.timezone.isHome && "fill-current"
              )}
            />
          </button>
        </div>

        {/* City/Country + Current Time - Uses JS transform on mobile, sticky on desktop */}
        <div
          className={cn(
            // Explicit viewport width on mobile (not w-full): the row is wider than
            // the viewport, and a sticky element needs free space in its containing
            // block to slide within, otherwise sticky is a no-op.
            "w-screen lg:w-64 shrink-0 px-4 py-3.5 lg:px-2 lg:py-0",
            // Native sticky is compositor-driven, so the text stays perfectly
            // still during touch scrolling (JS scroll-following always lags a frame).
            "sticky left-0 z-20",
            "bg-white dark:bg-stone-900",
            "flex items-center mb-0 lg:mb-0 lg:mr-3",
            "rounded-t-2xl lg:rounded-none"
          )}
        >
          <div className="flex w-full items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile edit-mode controls to the left of city */}
              {isMobile && isEditMode && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Home Button (mobile edit mode) */}
                  <button
                    onClick={() => onSetHome(display.timezone.id)}
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-stone-500",
                      display.timezone.isHome
                        ? "text-slate-700 dark:text-stone-300 bg-slate-100 dark:bg-stone-800"
                        : "text-slate-400 dark:text-stone-500 hover:text-slate-600 dark:hover:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-800"
                    )}
                    aria-label={
                      display.timezone.isHome
                        ? `${display.timezone.city} is the home timezone`
                        : `Set ${display.timezone.city} as home timezone`
                    }
                  >
                    <Home
                      className={cn(
                        "h-4 w-4",
                        display.timezone.isHome && "fill-current"
                      )}
                    />
                  </button>
                  {/* Remove Button (mobile edit mode) */}
                  <button
                    onClick={() => onRemove(display.timezone.id)}
                    className="flex items-center justify-center h-8 w-8 rounded-md text-slate-500 dark:text-stone-400 transition-colors hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-stone-500"
                    aria-label={`Remove ${display.timezone.city}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-1 min-w-0">
                {/* Date - shown on mobile only, above city */}
                <span className="text-xs lg:hidden text-muted-foreground leading-tight tracking-tight">
                  {display.formattedDate}
                </span>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-2xl lg:text-sm font-semibold text-slate-900 dark:text-stone-100 leading-tight tracking-tight truncate">
                    {display.timezone.city}
                  </span>
                  <span className="text-xs lg:text-[11px] text-slate-600 dark:text-stone-400 leading-tight tracking-tight font-medium shrink-0">
                    {display.offsetDisplay}
                  </span>
                </div>
                <div
                  className="hidden lg:flex items-center gap-1 min-w-0"
                  title={fullLocationLabel}
                >
                  {display.timezone.country ? (
                    <span className="text-xs lg:text-[11px] text-slate-500 dark:text-stone-400 leading-tight tracking-tight truncate">
                      {display.timezone.country}
                    </span>
                  ) : null}
                  {holidayName ? (
                    <span className="text-xs lg:text-[11px] text-red-600 dark:text-red-400 leading-tight tracking-tight truncate">
                      {display.timezone.country ? `· ${holidayName}` : holidayName}
                    </span>
                  ) : null}
                </div>
                {holidayName ? (
                  <span
                    className="lg:hidden text-[11px] text-red-600 dark:text-red-400 leading-tight tracking-tight truncate"
                    title={fullLocationLabel}
                  >
                    {holidayName}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isMobile && isEditMode ? (
                <button
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-md text-slate-500 dark:text-stone-400 transition-colors hover:text-slate-700 dark:hover:text-stone-200 hover:bg-slate-50 dark:hover:bg-stone-800 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-stone-500"
                  )}
                  aria-label={`Reorder ${display.timezone.city}`}
                  {...dragHandleProps}
                >
                  <GripHorizontal className="h-4 w-4" />
                </button>
              ) : (
                <>
                  {/* Time - shown on mobile, right-aligned */}
                  <span className="text-3xl lg:hidden font-semibold tracking-tight text-foreground leading-tight">
                    {display.formattedTime}
                  </span>
                  {/* Time and date - shown on desktop */}
                  <div className="hidden lg:flex flex-col items-end gap-1">
                    <span className="text-base font-semibold tracking-tight text-foreground leading-tight">
                      {display.formattedTime}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight tracking-tight">
                      {display.formattedDate}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Timeline - Hidden on mobile when in edit mode */}
        {!(isMobile && isEditMode) && (
          <div className="relative flex w-full lg:w-full pl-0 lg:pl-4 flex-1 xl:min-w-0 items-center">
            <div
              data-timeline-flex-container
              className={cn(
                "relative flex items-center overflow-hidden shrink-0",
                // Mobile: subtle border inside card
                "border-0 lg:border lg:border-slate-400 dark:lg:border-stone-600",
                "rounded-b-xl lg:rounded-md",
                "h-[56px] lg:h-auto",
                // Desktop: subtle top border to separate from info
                "lg:border-t lg:border-t-slate-400 dark:lg:border-t-stone-600",
                // Mobile: Show 7 hours visible, scrollable to see all 24
                // Extend to screen edges by using viewport width
                "w-[calc(100vw*(24/7))]",
                // Desktop (lg): Fixed width for consistency
                "lg:w-[1200px]",
                // XL: Full width, flexible
                "xl:w-full xl:flex-1"
              )}
            >
              {referenceHours.map((referenceHour, hourIndex) => (
                <HourCell
                  key={hourIndex}
                  referenceHour={referenceHour}
                  timezoneId={display.timezone.id}
                  hourIndex={hourIndex}
                  totalHours={referenceHours.length}
                  isHighlightedMobile={
                    isMobile &&
                    highlightedColumnIndex !== null &&
                    hourIndex === highlightedColumnIndex
                  }
                  isCenterColumn={
                    isMobile &&
                    centerColumnIndex !== null &&
                    hourIndex === centerColumnIndex
                  }
                  isCurrentHour={
                    currentHourIndexForRow !== null &&
                    hourIndex === currentHourIndexForRow
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
