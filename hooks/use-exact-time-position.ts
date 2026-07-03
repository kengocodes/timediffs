import { useMemo } from "react";
import { Temporal } from "@/lib/temporal";

interface UseExactTimePositionParams {
  referenceTimezone: { timezone: { id: string } } | undefined;
  referenceHours: Temporal.ZonedDateTime[];
  now: Temporal.Instant;
  shouldShow: boolean;
}

export interface ExactTimePosition {
  columnIndex: number | null;
  offsetPercentage: number; // 0-100, position within the hour column
  exactTime: Temporal.Instant | null;
}

/**
 * Custom hook to calculate the exact position of the current time within the timeline.
 * Returns the column index and the precise offset within that column (0-100%).
 * Only calculates if shouldShow is true.
 */
export function useExactTimePosition({
  referenceTimezone,
  referenceHours,
  now,
  shouldShow,
}: UseExactTimePositionParams): ExactTimePosition {
  return useMemo(() => {
    if (!referenceTimezone || referenceHours.length === 0 || !shouldShow) {
      return {
        columnIndex: null,
        offsetPercentage: 0,
        exactTime: null,
      };
    }

    // Current wall-clock time in the reference timezone
    const refNow = now.toZonedDateTimeISO(referenceTimezone.timezone.id);

    // Find which hour block contains the current time
    const currentHourIndex = referenceHours.findIndex(
      (hour) => hour.hour === refNow.hour && hour.day === refNow.day
    );

    if (currentHourIndex === -1) {
      return {
        columnIndex: null,
        offsetPercentage: 0,
        exactTime: null,
      };
    }

    // Calculate the offset percentage within the hour column
    // Minutes (0-59) + seconds (0-59) / 60 = total fraction of hour
    const totalMinutes = refNow.minute + refNow.second / 60;
    const offsetPercentage = (totalMinutes / 60) * 100;

    return {
      columnIndex: currentHourIndex,
      offsetPercentage,
      exactTime: now,
    };
  }, [referenceTimezone, referenceHours, now, shouldShow]);
}
