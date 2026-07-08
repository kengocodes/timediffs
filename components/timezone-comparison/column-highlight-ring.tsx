"use client";

import { motion, type Transition } from "motion/react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface ColumnHighlightRingProps {
  columnIndex: number | null;
  totalColumns: number;
  isHovered: boolean;
}

interface FlexContainerMeasurements {
  left: number;
  width: number;
}

// Animation configuration - extracted for readability and reusability
const RING_TRANSITION: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.5,
};

/**
 * A single ring indicator that highlights a column across all timeline rows.
 * Positioned absolutely to span from the first row to the last row.
 * The ring wraps exactly around the hour blocks in the specified column.
 *
 * Measures the actual position and width of the flex container for accurate positioning.
 */
export function ColumnHighlightRing({
  columnIndex,
  totalColumns,
  isHovered,
}: ColumnHighlightRingProps) {
  const isMobile = useIsMobile();
  const [measurements, setMeasurements] =
    useState<FlexContainerMeasurements | null>(null);

  // Measure the flex container's actual position and width
  useEffect(() => {
    // No ring on mobile, so skip measuring; render guards on isMobile too
    if (isMobile) {
      return;
    }

    const measureContainer = () => {
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
      const nextMeasurements = {
        left: containerRect.left - parentRect.left,
        width: flexContainer.offsetWidth,
      };

      setMeasurements((current) => {
        if (
          current &&
          current.left === nextMeasurements.left &&
          current.width === nextMeasurements.width
        ) {
          return current;
        }

        return nextMeasurements;
      });
    };

    measureContainer();
    window.addEventListener("resize", measureContainer);

    // Track layout changes of the hour strip (e.g. rows added/removed,
    // viewport-driven reflow) that don't fire a window resize
    const flexContainer = document.querySelector(
      "[data-timeline-flex-container]"
    );
    const resizeObserver = new ResizeObserver(measureContainer);
    if (flexContainer) {
      resizeObserver.observe(flexContainer);
    }

    // Re-measure after the row entry animation settles: getBoundingClientRect
    // includes the entry scale transform, so earlier reads are shifted
    const timeoutId = setTimeout(measureContainer, 350);

    return () => {
      window.removeEventListener("resize", measureContainer);
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [isMobile, columnIndex, totalColumns]);

  // Hide on mobile screens
  if (isMobile || columnIndex === null || totalColumns === 0 || !measurements) {
    return null;
  }

  // Calculate column position and width in pixels
  const columnWidth = measurements.width / totalColumns;
  const columnLeft = measurements.left + columnIndex * columnWidth;

  return (
    <motion.div
      className="absolute pointer-events-none z-30"
      initial={false}
      animate={{
        left: columnLeft,
        width: columnWidth,
        opacity: isHovered ? 1 : 0.5,
      }}
      transition={RING_TRANSITION}
      style={{
        top: 0,
        bottom: 0,
      }}
    >
      <div className="h-full border-2 border-black dark:border-white rounded-md" />
    </motion.div>
  );
}
