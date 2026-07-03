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
  detectedTimezone: string | null;
  clearDetectedTimezone: () => void;
  /** Live clock, ticking every second. */
  currentTime: Temporal.Instant;
  /** True when the selected date is today in the browser's timezone. */
  isViewingToday: boolean;
  /**
   * The instant all displays are rendered for: the live clock when viewing
   * today, otherwise local midnight of the selected date.
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

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  // Sync URL state with nuqs hooks
  const [urlState, setUrlState] = useQueryStates({
    tz: parseAsTimezoneArray,
    date: parseAsPlainDate.withDefault(Temporal.Now.plainDateISO()),
    format: parseAsTimeFormat,
    home: parseAsHomeTimezone,
  });

  // Track if we've initialized from URL to prevent overwriting user changes
  const initializedFromUrlRef = useRef(false);
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);

  // Detect browser timezone
  const getBrowserTimezone = useCallback((): string | null => {
    try {
      const tz = Temporal.Now.timeZoneId();
      return isValidTimezoneId(tz) ? tz : null;
    } catch {
      return null;
    }
  }, []);

  // Initialize timezones from URL or defaults
  const [timezones, setTimezones] = useState<Timezone[]>([]);

  // Initialize from URL on mount (only once)
  useEffect(() => {
    if (initializedFromUrlRef.current) return;

    // If URL has timezones, use them (validate first)
    if (urlState.tz && urlState.tz.length > 0) {
      const validIds = urlState.tz.filter(isValidTimezoneId);
      if (validIds.length > 0) {
        const initial = validIds.map((id) => createTimezoneFromId(id));
        // Set home timezone if specified in URL
        if (urlState.home && validIds.includes(urlState.home)) {
          initial.forEach((tz) => {
            tz.isHome = tz.id === urlState.home;
          });
        } else if (initial.length > 0) {
          initial[0].isHome = true;
        }
        setTimezones(initial);
        initializedFromUrlRef.current = true;
        return;
      }
    }

    // No URL timezones - set up defaults (browser timezone + 4 others, or 5 backups)
    const browserTz = getBrowserTimezone();
    let defaultIds: string[];

    if (browserTz) {
      // Browser timezone detected: use it + 4 additional timezones (filter out duplicates)
      // User's timezone is most popular, so it comes first
      const additionalFiltered = ADDITIONAL_TIMEZONES.filter(
        (tz) => tz !== browserTz
      );
      defaultIds = [browserTz, ...additionalFiltered.slice(0, 4)];
      setDetectedTimezone(browserTz);
    } else {
      // Browser timezone not detected: use 5 backup timezones
      defaultIds = BACKUP_TIMEZONES;
    }

    const initial = defaultIds.map((id) => createTimezoneFromId(id));
    initial[0].isHome = true;
    setTimezones(initial);

    // Mark as initialized
    initializedFromUrlRef.current = true;
  }, [urlState.tz, urlState.home, getBrowserTimezone]);

  // Live clock, updated every second for smooth real-time indicator movement
  const [currentTime, setCurrentTime] = useState(() => Temporal.Now.instant());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Temporal.Now.instant());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const selectedDate = urlState.date;

  // Derived from the ticking clock so the flag flips at midnight
  const isViewingToday = selectedDate.equals(
    currentTime.toZonedDateTimeISO(Temporal.Now.timeZoneId()).toPlainDate()
  );

  const effectiveInstant = useMemo(() => {
    if (isViewingToday) {
      return currentTime;
    }
    // Local midnight of the selected date in the browser's timezone
    return selectedDate.toZonedDateTime(Temporal.Now.timeZoneId()).toInstant();
  }, [isViewingToday, currentTime, selectedDate]);

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

  // Sync timezones to URL when they change (but not during initial URL load)
  useEffect(() => {
    // Don't sync if we haven't initialized from URL yet
    if (!initializedFromUrlRef.current) return;

    const timezoneIds = timezones.map((tz) => tz.id);
    const homeId = timezones.find((tz) => tz.isHome)?.id || null;

    // Only update URL if different from current state
    const tzChanged =
      JSON.stringify(timezoneIds) !== JSON.stringify(urlState.tz);
    const homeChanged = homeId !== urlState.home;

    if (tzChanged || homeChanged) {
      setUrlState({
        tz: timezoneIds,
        home: homeId,
      });
    }
  }, [timezones, urlState.tz, urlState.home, setUrlState]);

  const addTimezone = useCallback((timezoneId: string) => {
    // Validate timezone ID
    if (!isValidTimezoneId(timezoneId)) {
      console.warn(`Invalid timezone ID: ${timezoneId}`);
      return;
    }

    setTimezones((prev) => {
      // Check if timezone already exists
      if (prev.some((tz) => tz.id === timezoneId)) {
        return prev;
      }

      // Enforce maximum limit to prevent DoS and performance issues
      if (prev.length >= MAX_TIMEZONES) {
        console.warn(
          `Maximum timezone limit (${MAX_TIMEZONES}) reached. Cannot add more timezones.`
        );
        return prev;
      }

      const newTimezone = createTimezoneFromId(timezoneId);
      return [...prev, newTimezone];
    });
  }, []);

  const removeTimezone = useCallback((timezoneId: string) => {
    setTimezones((prev) => {
      const filtered = prev.filter((tz) => tz.id !== timezoneId);
      // If removed timezone was home, set first remaining as home
      const wasHome = prev.find((tz) => tz.id === timezoneId)?.isHome;
      if (wasHome && filtered.length > 0) {
        filtered[0].isHome = true;
      }
      return filtered;
    });
  }, []);

  const setHomeTimezone = useCallback((timezoneId: string) => {
    setTimezones((prev) =>
      prev.map((tz) => ({
        ...tz,
        isHome: tz.id === timezoneId,
      }))
    );
  }, []);

  const reorderTimezones = useCallback((newOrderIds: string[]) => {
    setTimezones((prev) => {
      if (newOrderIds.length !== prev.length) return prev;
      const idToTz = new Map(prev.map((tz) => [tz.id, tz]));
      const next: Timezone[] = [];
      for (const id of newOrderIds) {
        const tz = idToTz.get(id);
        if (!tz) return prev;
        next.push(tz);
      }
      return next;
    });
  }, []);

  const handleSetSelectedDate = useCallback(
    (date: Temporal.PlainDate) => {
      // Update URL state, which will trigger selectedDate update
      setUrlState({ date });
    },
    [setUrlState]
  );

  const handleSetTimeFormat = useCallback(
    (format: TimeFormat) => {
      // Update URL state, which will trigger timeFormat update
      setUrlState({ format });
    },
    [setUrlState]
  );

  const clearDetectedTimezone = useCallback(() => {
    setDetectedTimezone(null);
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
        detectedTimezone,
        clearDetectedTimezone,
        currentTime,
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
