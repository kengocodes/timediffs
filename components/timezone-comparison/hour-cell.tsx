import { cn } from "@/lib/utils";
import { Temporal } from "@/lib/temporal";
import { getTimeOfDay } from "@/lib/timezone";
import { TIME_OF_DAY_CONFIG, NEW_DAY_CONFIG } from "@/lib/timeline-constants";
import { useTimezone } from "@/contexts/timezone-context";

interface HourCellProps {
  referenceHour: Temporal.ZonedDateTime;
  timezoneId: string;
  hourIndex: number;
  totalHours: number;
  onSelectReferenceHour?: (referenceHour: Temporal.ZonedDateTime) => void;
  isHighlightedMobile?: boolean;
  isCenterColumn?: boolean;
  isCurrentHour?: boolean;
}

/**
 * Renders a single hour cell in the timeline visualization.
 * Displays hour in 12-hour (AM/PM) or 24-hour format based on user preference,
 * or date for new day markers.
 */
export function HourCell({
  referenceHour,
  timezoneId,
  hourIndex,
  totalHours,
  onSelectReferenceHour,
  isHighlightedMobile = false,
  isCenterColumn = false,
  isCurrentHour = false,
}: HourCellProps) {
  const { timeFormat } = useTimezone();
  const localTime = referenceHour.withTimeZone(timezoneId);
  const previousLocalTime = referenceHour
    .subtract({ hours: 1 })
    .withTimeZone(timezoneId);
  const hourInTz = localTime.hour;
  const minuteInTz = localTime.minute;
  const minuteLabel = minuteInTz.toString().padStart(2, "0");
  const hour12 = ((hourInTz + 11) % 12) + 1;
  const amPm = hourInTz < 12 ? "am" : "pm";
  const isNewDay =
    localTime.year !== previousLocalTime.year ||
    localTime.month !== previousLocalTime.month ||
    localTime.day !== previousLocalTime.day;
  const hourLabel24 =
    minuteInTz === 0
      ? hourInTz.toString().padStart(2, "0")
      : `${hourInTz.toString().padStart(2, "0")}:${minuteLabel}`;
  const hourLabel12 = minuteInTz === 0 ? String(hour12) : `${hour12}:${minuteLabel}`;

  const monthLabel = isNewDay
    ? localTime.toLocaleString("en-US", { month: "short" })
    : null;
  const dayLabel = isNewDay ? String(localTime.day) : null;

  const timeOfDay = getTimeOfDay(hourInTz);
  const config = isNewDay ? NEW_DAY_CONFIG : TIME_OF_DAY_CONFIG[timeOfDay];
  
  // Current hour gets a slightly darker/more saturated background for subtle emphasis
  // Day: amber-100 -> amber-200, Evening: indigo-100 -> indigo-200, Night: slate-100 -> slate-200
  const bgClass = isCurrentHour && !isNewDay
    ? timeOfDay === "day"
      ? "bg-amber-200 dark:bg-amber-800/60"
      : timeOfDay === "evening"
      ? "bg-indigo-200 dark:bg-indigo-800/60"
      : "bg-slate-200 dark:bg-stone-700"
    : isNewDay
    ? NEW_DAY_CONFIG.bg
    : config.bg;
  
  const textPrimaryClass = isHighlightedMobile 
    ? "text-slate-950" 
    : config.text;
  const textMutedClass = isHighlightedMobile 
    ? "text-slate-900" 
    : config.textMuted;

  const isFirstHour = hourIndex === 0;
  const isLastHour = hourIndex === totalHours - 1;

  return (
    <button
      type="button"
      onClick={() => onSelectReferenceHour?.(referenceHour)}
      className={cn(
        "relative flex flex-col items-center justify-center shrink-0",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
        "h-[56px] lg:h-auto lg:min-h-[38px]",
        // Mobile: Each hour is 1/24 of timeline width (timeline shows 7 hours visible)
        "w-[calc(100%/24)]",
        // Desktop (lg): Fixed width per hour
        "lg:w-[50px]",
        // XL: Flexible width to fill available space
        "xl:flex-1",
        bgClass,
        // Subtle borders between cells
        !isLastHour && "border-r border-slate-200/60 dark:border-stone-700/60 lg:border-slate-200 dark:lg:border-stone-600",
        // Mobile: First cell gets rounded bottom-left, last gets rounded bottom-right
        isFirstHour && "rounded-bl-xl lg:rounded-l-md lg:rounded-bl-md",
        isLastHour && "rounded-br-xl lg:rounded-r-md lg:rounded-br-md"
      )}
      aria-label={`Set all timezones to ${localTime.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`}
      title={`${hourInTz.toString().padStart(2, "0")}:${minuteLabel}`}
    >
      {isHighlightedMobile ? (
        <div className="absolute inset-0 bg-slate-400/20 dark:bg-stone-400/20 pointer-events-none z-0" />
      ) : null}
      {isCenterColumn ? (
        <div className="absolute inset-0 bg-blue-500/15 dark:bg-blue-400/20 pointer-events-none z-0" />
      ) : null}
      {isNewDay && monthLabel && dayLabel ? (
        <div className="flex flex-col items-center gap-[2px] z-10">
          <span
            className={cn(
              "text-sm lg:text-xs font-semibold leading-tight tracking-tight",
              textPrimaryClass
            )}
          >
            {monthLabel}
          </span>
          <span
            className={cn(
              "text-[10px] leading-tight tracking-tight",
              textMutedClass
            )}
          >
            {dayLabel}
          </span>
        </div>
      ) : timeFormat === "24h" ? (
        <div className="flex flex-col items-center justify-center z-10">
          <span
            className={cn(
              "text-sm lg:text-xs font-semibold leading-tight tracking-tight",
              textPrimaryClass
            )}
          >
            {hourLabel24}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-[2px] z-10">
          <span
            className={cn(
              "text-sm lg:text-xs font-semibold leading-tight tracking-tight",
              textPrimaryClass
            )}
          >
            {hourLabel12}
          </span>
          <span
            className={cn(
              "text-[10px] leading-tight tracking-tight",
              textMutedClass
            )}
          >
            {amPm}
          </span>
        </div>
      )}
    </button>
  );
}
