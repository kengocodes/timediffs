"use client";

import { useTimezone } from "@/contexts/timezone-context";
import { getTimelineHours, findHourIndexForInstant } from "@/lib/timezone";
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
import { RotateCcw } from "lucide-react";

interface TimelineVisualizationProps {
  onRemoveTimezone: (timezoneId: string) => void;
  isEditMode?: boolean;
}

// Animation configuration for timeline rows
const rowAnimationVariants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95,
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
    },
  }),
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
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
    selectedTimelineInstant,
    setSelectedTimelineInstant,
    clearSelectedTimelineInstant,
    isViewingToday,
    effectiveInstant,
  } = useTimezone();
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const holidayNamesByTimezone = useHolidays(
    timezoneDisplays,
    effectiveInstant,
  );

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
    [referenceTimezoneId, selectedDate],
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

  // Calculate current hour index for mobile scrolling and highlighting.
  // Matched by instant (not wall-clock hour) so DST fall-back days resolve
  // to the correct one of the two repeated hours.
  const currentHourIndex = useMemo(() => {
    if (!isViewingToday || !referenceTimezone || referenceHours.length === 0) {
      return null;
    }

    return findHourIndexForInstant(referenceHours, effectiveInstant);
  }, [isViewingToday, referenceTimezone, referenceHours, effectiveInstant]);

  const hasPinnedTimelineInstant = selectedTimelineInstant !== null;

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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const items = useMemo(
    () => timezoneDisplays.map((d) => d.timezone.id),
    [timezoneDisplays],
  );

  const activeDisplay = useMemo(
    () => timezoneDisplays.find((d) => d.timezone.id === activeId) || null,
    [activeId, timezoneDisplays],
  );

  // Early return after all hooks have been called
  if (!hasTimezones) {
    return null;
  }

  const handleTimelineKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const scrollStep = 80;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      container.scrollBy({ left: -scrollStep, behavior: "smooth" });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      container.scrollBy({ left: scrollStep, behavior: "smooth" });
    }
  };

  const handleSelectReferenceHour = (referenceHour: Temporal.ZonedDateTime) => {
    setSelectedTimelineInstant(referenceHour.toInstant());
  };

  return (
    <div
      ref={scrollContainerRef}
      className="w-screen lg:w-full overflow-x-auto lg:overflow-x-auto xl:overflow-x-visible scroll-touch -mx-3 lg:mx-0"
      tabIndex={0}
      role="region"
      aria-label="Timezone comparison timeline"
      onKeyDown={handleTimelineKeyDown}
    >
      <div
        ref={timelineContainerRef}
        data-timeline-container
        // min-w-max on mobile: rows must be as wide as the overflowing timeline
        // strip so the sticky info block has room to slide within its row.
        className="relative min-w-max lg:min-w-[1650px] xl:min-w-0 lg:mt-10"
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
        {referenceTimezone && !hasPinnedTimelineInstant && (
          <ExactTimeIndicator
            position={exactTimePosition}
            totalColumns={referenceHours.length}
            referenceTimezoneId={referenceTimezone.timezone.id}
          />
        )}

        {hasPinnedTimelineInstant ? (
          <div className="flex justify-end mb-2 pr-3 lg:pr-0">
            <button
              type="button"
              onClick={clearSelectedTimelineInstant}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-stone-500"
              aria-label="Return to original timeline time"
              title="Return to original timeline time"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset time</span>
            </button>
          </div>
        ) : null}

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
                    onSelectReferenceHour={handleSelectReferenceHour}
                    highlightedColumnIndex={highlightedColumnIndex}
                    centerColumnIndex={centerColumnIndex}
                    onRemove={onRemoveTimezone}
                    onSetHome={setHomeTimezone}
                    isEditMode={isEditMode}
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
                  holidayName={
                    holidayNamesByTimezone[activeDisplay.timezone.id]
                  }
                  referenceHours={referenceHours}
                  onSelectReferenceHour={handleSelectReferenceHour}
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
