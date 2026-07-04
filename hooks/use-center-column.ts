"use client";

import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "./use-is-mobile";

interface UseCenterColumnParams {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  totalColumns: number;
  enabled?: boolean;
}

/**
 * Calculates which column is centered in the viewport based on scroll position.
 */
function calculateCenterColumn(
  scrollContainer: HTMLElement,
  totalColumns: number
): number | null {
  const flexContainer = scrollContainer.querySelector(
    "[data-timeline-flex-container]"
  ) as HTMLElement;

  if (!flexContainer) {
    return null;
  }

  const timelineWidth = flexContainer.offsetWidth;
  const containerWidth = scrollContainer.clientWidth;
  const scrollLeft = scrollContainer.scrollLeft;

  // Calculate the center point of the visible viewport
  const viewportCenter = scrollLeft + containerWidth / 2;

  // Calculate which column is at the center
  const columnWidth = timelineWidth / totalColumns;
  const centerColumn = Math.floor(viewportCenter / columnWidth);

  // Clamp to valid range
  return Math.max(0, Math.min(centerColumn, totalColumns - 1));
}

/**
 * Hook that tracks which column is in the center of the viewport
 * during horizontal scrolling on mobile. Useful for visual alignment indicators.
 */
export function useCenterColumn({
  scrollContainerRef,
  totalColumns,
  enabled = true,
}: UseCenterColumnParams) {
  const isMobile = useIsMobile();
  const [centerColumnIndex, setCenterColumnIndex] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const shouldTrack = isMobile && enabled && totalColumns > 0;

  useEffect(() => {
    if (!shouldTrack) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const updateCenterColumn = () => {
      const newCenterColumn = calculateCenterColumn(scrollContainer, totalColumns);
      setCenterColumnIndex(newCenterColumn);
    };

    const handleScroll = () => {
      // Use requestAnimationFrame to throttle updates
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(updateCenterColumn);
    };

    // Initial calculation
    updateCenterColumn();

    // Listen to scroll events
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    // Also listen to resize events in case container size changes
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // Note: scrollContainerRef is intentionally omitted from deps - refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
  }, [shouldTrack, totalColumns]);

  return shouldTrack ? centerColumnIndex : null;
}

