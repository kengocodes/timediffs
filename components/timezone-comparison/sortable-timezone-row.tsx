"use client";

import { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { Temporal } from "@/lib/temporal";
import type { TimezoneDisplay } from "@/types";
import { TimezoneRow } from "./timezone-row";

interface SortableTimezoneRowProps {
  display: TimezoneDisplay;
  holidayName?: string;
  referenceHours: Temporal.ZonedDateTime[];
  onRemove: (timezoneId: string) => void;
  onSetHome: (timezoneId: string) => void;
  highlightedColumnIndex?: number | null;
  centerColumnIndex?: number | null;
  isEditMode?: boolean;
  currentHourIndex?: number | null;
  referenceTimezoneId?: string;
}

export function SortableTimezoneRow({
  display,
  holidayName,
  referenceHours,
  onRemove,
  onSetHome,
  highlightedColumnIndex,
  centerColumnIndex,
  isEditMode = false,
  currentHourIndex = null,
  referenceTimezoneId,
}: SortableTimezoneRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: display.timezone.id });

  const style = useMemo<React.CSSProperties>(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      // Keep height during drag for smoother list behavior
      willChange: "transform",
      // Hide the original item while dragging to avoid duplicate under the overlay
      opacity: isDragging ? 0 : undefined,
    };
  }, [transform, transition, isDragging]);

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style}
      layout
      transition={{
        layout: {
          type: "spring" as const,
          stiffness: 350,
          damping: 35,
        }
      }}
    >
      <TimezoneRow
        display={display}
        holidayName={holidayName}
        referenceHours={referenceHours}
        onRemove={onRemove}
        onSetHome={onSetHome}
        highlightedColumnIndex={highlightedColumnIndex}
        centerColumnIndex={centerColumnIndex}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        isEditMode={isEditMode}
        currentHourIndex={currentHourIndex}
        referenceTimezoneId={referenceTimezoneId}
      />
    </motion.div>
  );
}
