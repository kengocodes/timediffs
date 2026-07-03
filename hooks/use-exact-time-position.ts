import { useMemo } from "react";
import { Temporal } from "@/lib/temporal";
import { findHourIndexForInstant } from "@/lib/timezone";

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

    // Match by instant rather than wall-clock hour so DST fall-back days
    // (with two columns sharing the same wall-clock hour) resolve correctly.
    const currentHourIndex = findHourIndexForInstant(referenceHours, now);

    if (currentHourIndex === null) {
      return {
        columnIndex: null,
        offsetPercentage: 0,
        exactTime: null,
      };
    }

    // Offset within the hour column as elapsed fraction of that column's
    // real duration (an hour, except at DST boundaries).
    const columnStartMs = referenceHours[currentHourIndex].epochMilliseconds;
    const elapsedMs = now.epochMilliseconds - columnStartMs;
    const offsetPercentage = Math.min(
      100,
      Math.max(0, (elapsedMs / 3_600_000) * 100)
    );

    return {
      columnIndex: currentHourIndex,
      offsetPercentage,
      exactTime: now,
    };
  }, [referenceTimezone, referenceHours, now, shouldShow]);
}
