"use client";

import { useTimezone } from "@/contexts/timezone-context";
import { getTimelineHours } from "@/lib/timezone";
import { useTimelineHover } from "@/hooks/use-timeline-hover";
import { useExactTimePosition } from "@/hooks/use-exact-time-position";
import { useScrollToCurrentTime } from "@/hooks/use-scroll-to-current-time";
import { useCenterColumn } from "@/hooks/use-center-column";
import { ColumnHighlightRing } from "./column-highlight-ring";
import { ExactTimeIndicator } from "./exact-time-indicator";
import { useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableTimezoneRow } from "./sortable-timezone-row";
import { TimezoneRow } from "./timezone-row";
import { useHolidays } from "@/hooks/use-holidays";

interface TimelineVisualizationProps {
  onRemoveTimezone: (timezoneId: string) => void;
  isEditMode?: boolean;
}

// Animation configuration for timeline rows
const rowAnimationVariants = {
  initial: { 
    opacity: 0, 
    y: -20,
    scale: 0.95
  },
  animate: (index: number) => ({ 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      mass: 0.8,
      delay: index * 0.05, // Stagger effect based on index
    }
  }),
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const
    }
  }
};

/**
 * Main timeline visualization component that displays multiple timezones
 * in a horizontal 24-hour timeline with interactive hover effects.
 */
export function TimelineVisualization({
  onRemoveTimezone,
  isEditMode = false,
}: TimelineVisualizationProps) {
  const {
    timezoneDisplays,
    setHomeTimezone,
    reorderTimezones,
    selectedDate,
    currentTime,
    isViewingToday,
    effectiveInstant,
  } = useTimezone();
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const holidayNamesByTimezone = useHolidays(timezoneDisplays, effectiveInstant);

  // Early return check must happen after basic hooks but before hooks that depend on data
  // However, we need to ensure all hooks are always called, so we'll handle empty state differently
  const hasTimezones = timezoneDisplays.length > 0;

  // Use home timezone as reference, or fallback to first timezone
  const referenceTimezone = hasTimezones
    ? timezoneDisplays.find((d) => d.timezone.isHome) || timezoneDisplays[0]
    : null;
  const referenceTimezoneId = referenceTimezone?.timezone.id;
  const referenceHours = useMemo(
    () =>
      referenceTimezoneId
        ? getTimelineHours(referenceTimezoneId, selectedDate)
        : [],
    [referenceTimezoneId, selectedDate]
  );

  // Track mouse hover position - always call with a valid number
  const {
    timelineContainerRef,
    hoveredColumnIndex,
    handleMouseMove,
    handleMouseLeave,
  } = useTimelineHover(referenceHours.length || 24);

  // Column to highlight (only on hover - exact time indicator handles current time)
  const highlightedColumnIndex = hoveredColumnIndex;

  // Calculate exact time position for precise indicator
  const exactTimePosition = useExactTimePosition({
    referenceTimezone: referenceTimezone ?? undefined,
    referenceHours,
    now: currentTime,
    shouldShow: isViewingToday,
  });

  // Calculate current hour index for mobile scrolling and highlighting
  const currentHourIndex = useMemo(() => {
    if (!isViewingToday || !referenceTimezone || referenceHours.length === 0) {
      return null;
    }

    const refNow = currentTime.toZonedDateTimeISO(
      referenceTimezone.timezone.id
    );
    const index = referenceHours.findIndex(
      (hour) => hour.hour === refNow.hour && hour.day === refNow.day
    );

    return index >= 0 ? index : null;
  }, [isViewingToday, referenceTimezone, referenceHours, currentTime]);

  // Scroll to current time on mobile - always call hook, even if disabled
  useScrollToCurrentTime({
    scrollContainerRef,
    currentHourIndex,
    totalHours: referenceHours.length || 24,
    enabled: isViewingToday && hasTimezones,
  });

  // Track center column for mobile scroll alignment indicator
  const centerColumnIndex = useCenterColumn({
    scrollContainerRef,
    totalColumns: referenceHours.length || 24,
    enabled: hasTimezones,
  });

  // Always call useSensors - hooks must be called unconditionally
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const items = useMemo(
    () => timezoneDisplays.map((d) => d.timezone.id),
    [timezoneDisplays]
  );

  const activeDisplay = useMemo(
    () => timezoneDisplays.find((d) => d.timezone.id === activeId) || null,
    [activeId, timezoneDisplays]
  );

  // Early return after all hooks have been called
  if (!hasTimezones) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      className="w-screen lg:w-full overflow-x-auto lg:overflow-x-auto xl:overflow-x-visible scroll-touch -mx-3 lg:mx-0"
      tabIndex={0}
      role="region"
      aria-label="Timezone comparison timeline"
    >
      <div
        ref={timelineContainerRef}
        data-timeline-container
        className="relative min-w-0 lg:min-w-[1650px] xl:min-w-0 lg:mt-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Single column highlight ring spanning all rows */}
        <ColumnHighlightRing
          columnIndex={highlightedColumnIndex}
          totalColumns={referenceHours.length}
          isHovered={hoveredColumnIndex !== null}
        />

        {/* Exact time indicator showing precise current time position */}
        {referenceTimezone && (
          <ExactTimeIndicator
            position={exactTimePosition}
            totalColumns={referenceHours.length}
            referenceTimezoneId={referenceTimezone.timezone.id}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={(event: DragStartEvent) => {
            const id = String(event.active.id);
            setActiveId(id);
          }}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);
            if (!over) return;
            const activeIndex = items.indexOf(String(active.id));
            const overIndex = items.indexOf(String(over.id));
            if (activeIndex !== overIndex) {
              const newOrder = arrayMove(items, activeIndex, overIndex);
              reorderTimezones(newOrder);
            }
          }}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {timezoneDisplays.map((display, index) => (
                <motion.div
                  key={display.timezone.id}
                  layout
                  layoutId={display.timezone.id}
                  variants={rowAnimationVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  custom={index}
                  className="mb-3 lg:mb-4 lg:last:mb-0 last:mb-0"
                >
                  <SortableTimezoneRow
                    display={display}
                    holidayName={holidayNamesByTimezone[display.timezone.id]}
                    referenceHours={referenceHours}
                    highlightedColumnIndex={highlightedColumnIndex}
                    centerColumnIndex={centerColumnIndex}
                    onRemove={onRemoveTimezone}
                    onSetHome={setHomeTimezone}
                    isEditMode={isEditMode}
                    scrollContainerRef={scrollContainerRef}
                    currentHourIndex={currentHourIndex}
                    referenceTimezoneId={referenceTimezone?.timezone.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>
          <DragOverlay>
            {activeDisplay ? (
              <div className="mb-4 last:mb-0 pointer-events-none w-full opacity-100">
                <TimezoneRow
                  display={activeDisplay}
                  holidayName={holidayNamesByTimezone[activeDisplay.timezone.id]}
                  referenceHours={referenceHours}
                  highlightedColumnIndex={highlightedColumnIndex}
                  centerColumnIndex={centerColumnIndex}
                  onRemove={onRemoveTimezone}
                  onSetHome={setHomeTimezone}
                  isDragging
                  isEditMode={isEditMode}
                  currentHourIndex={currentHourIndex}
                  referenceTimezoneId={referenceTimezone?.timezone.id}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
