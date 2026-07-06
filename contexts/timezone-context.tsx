"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useQueryStates } from "nuqs";
import { Temporal } from "@/lib/temporal";
import type { Timezone, TimezoneDisplay } from "@/types";
import {
  createTimezoneDisplay,
  createTimezoneFromId,
  getAllTimezoneIds,
} from "@/lib/timezone";
import {
  parseAsTimezoneArray,
  parseAsPlainDate,
  parseAsTimeFormat,
  parseAsHomeTimezone,
  MAX_TIMEZONES,
} from "@/lib/url-parsers";

export type TimeFormat = "12h" | "24h";

interface TimezoneContextType {
  timezoneDisplays: TimezoneDisplay[];
  /** The calendar date the user selected (defaults to today). */
  selectedDate: Temporal.PlainDate;
  setSelectedDate: (date: Temporal.PlainDate) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  addTimezone: (timezoneId: string) => void;
  removeTimezone: (timezoneId: string) => void;
  setHomeTimezone: (timezoneId: string) => void;
  reorderTimezones: (newOrderIds: string[]) => void;
  /**
   * Replaces the whole timezone list (ordered) in a single state update,
   * optionally setting the home timezone. Bulk operations must use this
   * instead of chaining add/remove calls: functional URL-state updates
   * issued in the same tick read a stale snapshot and clobber each other.
   */
  setTimezones: (timezoneIds: string[], homeTimezoneId?: string) => void;
  /** Live clock, ticking every second. */
  currentTime: Temporal.Instant;
  /** Timeline-selected instant, used when the user pins a specific hour. */
  selectedTimelineInstant: Temporal.Instant | null;
  /** Pin all timezone displays to a specific timeline instant. */
  setSelectedTimelineInstant: (instant: Temporal.Instant | null) => void;
  /** Clear pinned timeline instant and return to default display behavior. */
  clearSelectedTimelineInstant: () => void;
  /** True when the selected date is today in the home (reference) timezone. */
  isViewingToday: boolean;
  /**
   * The instant all displays are rendered for: the live clock when viewing
   * today, otherwise midnight of the selected date in the home timezone
   * (matching the timeline grid, which is anchored to the home timezone).
   */
  effectiveInstant: Temporal.Instant;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(
  undefined
);

// Backup default timezones (used if browser timezone detection fails)
// Five most common timezones globally
const BACKUP_TIMEZONES = [
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "America/Los_Angeles",
  "Asia/Shanghai",
];

// Additional timezones to show alongside browser timezone (4 total to make 5 with browser)
// These are the most common timezones globally, in order of popularity
const ADDITIONAL_TIMEZONES = [
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "America/Los_Angeles",
  "Asia/Shanghai", // Extra option in case browser timezone matches one above
];

/**
 * Validates that a timezone ID exists in the available timezones.
 */
function isValidTimezoneId(id: string): boolean {
  try {
    const allIds = getAllTimezoneIds();
    return allIds.includes(id);
  } catch {
    return false;
  }
}

/** Filters a raw URL id list down to unique, known timezone IDs. */
function sanitizeTimezoneIds(ids: string[] | null): string[] {
  if (!ids) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id) || !isValidTimezoneId(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result.slice(0, MAX_TIMEZONES);
}

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  // The URL is the single source of truth for timezone selection, home
  // timezone, date, and format. Back/forward navigation and shared links
  // therefore always reflect in the UI without any state reconciliation.
  const [urlState, setUrlState] = useQueryStates({
    tz: parseAsTimezoneArray,
    date: parseAsPlainDate.withDefault(Temporal.Now.plainDateISO()),
    format: parseAsTimeFormat,
    home: parseAsHomeTimezone,
  });

  const defaultsAppliedRef = useRef(false);

  // Detect browser timezone
  const getBrowserTimezone = useCallback((): string | null => {
    try {
      const tz = Temporal.Now.timeZoneId();
      return isValidTimezoneId(tz) ? tz : null;
    } catch {
      return null;
    }
  }, []);

  // Timezone list derived from the URL (deduped and validated). The home
  // timezone falls back to the first entry when the URL has no valid `home`.
  const timezones = useMemo<Timezone[]>(() => {
    const validIds = sanitizeTimezoneIds(urlState.tz);
    if (validIds.length === 0) return [];

    const homeId =
      urlState.home && validIds.includes(urlState.home)
        ? urlState.home
        : validIds[0];

    return validIds.map((id) => ({
      ...createTimezoneFromId(id),
      isHome: id === homeId,
    }));
  }, [urlState.tz, urlState.home]);

  // Seed the URL with default timezones on first load when none are present
  // (browser timezone + 4 others, or 5 backups). Uses history replace so no
  // extra history entry is created.
  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    defaultsAppliedRef.current = true;

    if (sanitizeTimezoneIds(urlState.tz).length > 0) return;

    const browserTz = getBrowserTimezone();
    let defaultIds: string[];

    if (browserTz) {
      // Browser timezone detected: use it + 4 additional timezones (filter out duplicates)
      // User's timezone is most popular, so it comes first
      const additionalFiltered = ADDITIONAL_TIMEZONES.filter(
        (tz) => tz !== browserTz
      );
      defaultIds = [browserTz, ...additionalFiltered.slice(0, 4)];
    } else {
      // Browser timezone not detected: use 5 backup timezones
      defaultIds = BACKUP_TIMEZONES;
    }

    void setUrlState({ tz: defaultIds }, { history: "replace" });
  }, [urlState.tz, getBrowserTimezone, setUrlState]);

  // Live clock, updated every second for smooth real-time indicator movement
  const [currentTime, setCurrentTime] = useState(() => Temporal.Now.instant());
  const [selectedTimelineInstant, setSelectedTimelineInstant] =
    useState<Temporal.Instant | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Temporal.Now.instant());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const selectedDate = urlState.date;

  // The timeline grid is anchored to the home (reference) timezone, so
  // "today" and the render instant must use that same timezone. Falls back
  // to the browser timezone while the list is still empty.
  const homeTimezoneId = useMemo(() => {
    const home = timezones.find((tz) => tz.isHome) ?? timezones[0];
    return home?.id ?? Temporal.Now.timeZoneId();
  }, [timezones]);

  // Derived from the ticking clock so the flag flips at midnight
  const isViewingToday = selectedDate.equals(
    currentTime.toZonedDateTimeISO(homeTimezoneId).toPlainDate()
  );

  const effectiveInstant = useMemo(() => {
    if (selectedTimelineInstant) {
      return selectedTimelineInstant;
    }
    if (isViewingToday) {
      return currentTime;
    }
    // Midnight of the selected date in the home timezone, matching the
    // anchor used by getTimelineHours for the timeline grid.
    return selectedDate.toZonedDateTime(homeTimezoneId).toInstant();
  }, [
    selectedTimelineInstant,
    isViewingToday,
    currentTime,
    selectedDate,
    homeTimezoneId,
  ]);

  // Use format from URL or default to 12h
  const timeFormat = useMemo(() => {
    return urlState.format || "12h";
  }, [urlState.format]);

  // Fully derived from timezones + instant + format, so no state/effect needed
  const timezoneDisplays = useMemo<TimezoneDisplay[]>(
    () =>
      timezones.map((tz) =>
        createTimezoneDisplay(tz, effectiveInstant, timeFormat)
      ),
    [timezones, effectiveInstant, timeFormat]
  );

  const addTimezone = useCallback(
    (timezoneId: string) => {
      // Validate timezone ID
      if (!isValidTimezoneId(timezoneId)) {
        console.warn(`Invalid timezone ID: ${timezoneId}`);
        return;
      }

      void setUrlState((old) => {
        const current = sanitizeTimezoneIds(old.tz);
        if (current.includes(timezoneId)) {
          return {};
        }
        // Enforce maximum limit to prevent DoS and performance issues
        if (current.length >= MAX_TIMEZONES) {
          console.warn(
            `Maximum timezone limit (${MAX_TIMEZONES}) reached. Cannot add more timezones.`
          );
          return {};
        }
        return { tz: [...current, timezoneId] };
      });
    },
    [setUrlState]
  );

  const removeTimezone = useCallback(
    (timezoneId: string) => {
      void setUrlState((old) => {
        const current = sanitizeTimezoneIds(old.tz);
        if (!current.includes(timezoneId)) {
          return {};
        }
        const remaining = current.filter((id) => id !== timezoneId);
        // If the removed timezone was home, fall back to the first remaining
        const nextHome =
          old.home === timezoneId ? remaining[0] ?? null : old.home;
        return { tz: remaining, home: nextHome };
      });
    },
    [setUrlState]
  );

  const setHomeTimezone = useCallback(
    (timezoneId: string) => {
      void setUrlState((old) => {
        const current = sanitizeTimezoneIds(old.tz);
        if (!current.includes(timezoneId)) {
          return {};
        }
        return { home: timezoneId };
      });
    },
    [setUrlState]
  );

  const reorderTimezones = useCallback(
    (newOrderIds: string[]) => {
      void setUrlState((old) => {
        const current = sanitizeTimezoneIds(old.tz);
        // The new order must be a permutation of the current list:
        // same length, no duplicates, and every id currently displayed.
        if (newOrderIds.length !== current.length) return {};
        const uniqueIds = new Set(newOrderIds);
        if (uniqueIds.size !== newOrderIds.length) return {};
        if (!newOrderIds.every((id) => current.includes(id))) return {};
        return { tz: newOrderIds };
      });
    },
    [setUrlState]
  );

  const setTimezones = useCallback(
    (timezoneIds: string[], homeTimezoneId?: string) => {
      const nextIds = sanitizeTimezoneIds(timezoneIds);
      void setUrlState((old) => {
        // Keep the current home when it survives the replacement; otherwise
        // fall back to the explicit home or the first entry.
        const requestedHome = homeTimezoneId ?? old.home;
        const nextHome =
          requestedHome && nextIds.includes(requestedHome)
            ? requestedHome
            : nextIds[0] ?? null;
        return { tz: nextIds, home: nextHome };
      });
    },
    [setUrlState]
  );

  const handleSetSelectedDate = useCallback(
    (date: Temporal.PlainDate) => {
      // Update URL state, which will trigger selectedDate update
      void setUrlState({ date });
    },
    [setUrlState]
  );

  const handleSetTimeFormat = useCallback(
    (format: TimeFormat) => {
      // Update URL state, which will trigger timeFormat update
      void setUrlState({ format });
    },
    [setUrlState]
  );

  const clearSelectedTimelineInstant = useCallback(() => {
    setSelectedTimelineInstant(null);
  }, []);

  return (
    <TimezoneContext.Provider
      value={{
        timezoneDisplays,
        selectedDate,
        setSelectedDate: handleSetSelectedDate,
        timeFormat,
        setTimeFormat: handleSetTimeFormat,
        addTimezone,
        removeTimezone,
        setHomeTimezone,
        reorderTimezones,
        setTimezones,
        currentTime,
        selectedTimelineInstant,
        setSelectedTimelineInstant,
        clearSelectedTimelineInstant,
        isViewingToday,
        effectiveInstant,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}
