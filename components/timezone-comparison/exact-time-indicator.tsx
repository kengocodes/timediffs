"use client";

import { motion, type Transition } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { formatTime } from "@/lib/timezone";
import { useTimezone } from "@/contexts/timezone-context";
import type { ExactTimePosition } from "@/hooks/use-exact-time-position";

interface ExactTimeIndicatorProps {
  position: ExactTimePosition;
  totalColumns: number;
  referenceTimezoneId: string;
}

interface FlexContainerMeasurements {
  left: number;
  width: number;
}

// Animation configuration for smooth time updates
const INDICATOR_TRANSITION: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.3,
};

/**
 * Displays a vertical line and time label showing the exact current time position
 * within the timeline. Only visible when viewing today's date.
 * 
 * The indicator shows:
 * - A thin vertical line positioned precisely within the hour column
 * - A small badge/label above the timeline showing the exact time
 */
export function ExactTimeIndicator({
  position,
  totalColumns,
  referenceTimezoneId,
}: ExactTimeIndicatorProps) {
  const isMobile = useIsMobile();
  const { timeFormat } = useTimezone();
  const [measurements, setMeasurements] =
    useState<FlexContainerMeasurements | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastMeasurementsRef = useRef<FlexContainerMeasurements | null>(null);

  // Memoized measurement function to avoid stale closures
  const measureContainer = useCallback(() => {
    const flexContainer = document.querySelector(
      "[data-timeline-flex-container]"
    ) as HTMLElement;

    if (!flexContainer) return;

    const parentContainer = document.querySelector(
      "[data-timeline-container]"
    ) as HTMLElement;

    if (!parentContainer) return;

    const containerRect = flexContainer.getBoundingClientRect();
    const parentRect = parentContainer.getBoundingClientRect();

    const newMeasurements = {
      left: containerRect.left - parentRect.left,
      width: flexContainer.offsetWidth,
    };

    // Only update state if measurements actually changed to avoid unnecessary re-renders
    const last = lastMeasurementsRef.current;
    if (!last || last.left !== newMeasurements.left || last.width !== newMeasurements.width) {
      lastMeasurementsRef.current = newMeasurements;
      setMeasurements(newMeasurements);
    }
  }, []);

  // Use ResizeObserver to continuously monitor container dimensions
  // This ensures measurements stay accurate even when layout changes
  useEffect(() => {
    const flexContainer = document.querySelector(
      "[data-timeline-flex-container]"
    ) as HTMLElement;

    if (!flexContainer) return;

    // Initial measurement
    measureContainer();

    // Set up ResizeObserver for continuous monitoring
    resizeObserverRef.current = new ResizeObserver(() => {
      measureContainer();
    });
    resizeObserverRef.current.observe(flexContainer);

    // Also listen for window resize (for viewport changes that might not trigger ResizeObserver)
    window.addEventListener("resize", measureContainer);

    // Re-measure after animations likely complete (spring animations can take ~300-500ms)
    const timeoutId = setTimeout(measureContainer, 350);

    return () => {
      resizeObserverRef.current?.disconnect();
      window.removeEventListener("resize", measureContainer);
      clearTimeout(timeoutId);
    };
  }, [measureContainer]);

  // Hide if no position data, on mobile, or if measurements aren't ready
  if (
    isMobile ||
    position.columnIndex === null ||
    !position.exactTime ||
    totalColumns === 0 ||
    !measurements
  ) {
    return null;
  }

  // Calculate exact position in pixels
  const columnWidth = measurements.width / totalColumns;
  const columnLeft = measurements.left + position.columnIndex * columnWidth;
  const offsetInPixels = (position.offsetPercentage / 100) * columnWidth;
  const exactLeft = columnLeft + offsetInPixels;

  // Format the exact time for display
  const formattedTime = formatTime(
    position.exactTime,
    referenceTimezoneId,
    timeFormat
  );

  return (
    <>
      {/* Time label badge above the timeline */}
      <motion.div
        className="absolute pointer-events-none z-40"
        initial={false}
        animate={{
          left: exactLeft,
          opacity: 1,
        }}
        transition={INDICATOR_TRANSITION}
        style={{
          top: -32,
          transform: "translateX(-50%)",
        }}
      >
        <div className="px-2 py-1 bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium rounded-md shadow-sm whitespace-nowrap">
          {formattedTime}
        </div>
        {/* Small arrow pointing down */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-stone-100" />
      </motion.div>

      {/* Vertical line indicating exact time position */}
      <motion.div
        className="absolute pointer-events-none z-40"
        initial={false}
        animate={{
          left: exactLeft,
          opacity: 0.8,
        }}
        transition={INDICATOR_TRANSITION}
        style={{
          top: 0,
          bottom: 0,
        }}
      >
        <div className="h-full w-0.5 bg-slate-900 dark:bg-stone-100" />
      </motion.div>
    </>
  );
}

