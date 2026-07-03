import { Temporal } from "@/lib/temporal";
import type { Timezone, TimezoneDisplay, TimezoneId } from "@/types";
import { getTimezoneMap, getTimezoneData } from "./timezone-data";

/**
 * Parses an IANA timezone ID (e.g., "America/New_York") and extracts
 * the city name and region for display purposes.
 * Falls back to parsing the ID if not found in @vvo/tzdb.
 */
export function parseTimezoneId(timezoneId: string): {
  region: string;
  city: string;
  displayName: string;
} {
  const timezoneMap = getTimezoneMap();
  const tzData = timezoneMap.get(timezoneId);

  if (tzData) {
    // Use the first main city as the display name, or alternative name
    const city = tzData.mainCities?.[0] || tzData.alternativeName || "";
    const region = tzData.continentName || "";

    return {
      region,
      city,
      displayName: city || tzData.alternativeName || timezoneId,
    };
  }

  // Fallback: parse from IANA ID format
  const parts = timezoneId.split("/");
  const region = parts[0] || "";
  const city = parts.slice(1).join("/").replace(/_/g, " ") || "";

  return {
    region,
    city,
    displayName: city || timezoneId,
  };
}

const NANOSECONDS_PER_HOUR = 3_600_000_000_000;

/**
 * Returns the short localized zone name (e.g., "EST") for a timezone at a
 * given instant, or an empty string if unavailable.
 */
function getShortZoneName(timezoneId: string, instant: Temporal.Instant): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezoneId,
    timeZoneName: "short",
  });

  const parts = formatter.formatToParts(instant.epochMilliseconds);
  return parts.find((part) => part.type === "timeZoneName")?.value || "";
}

/** True for compact alphabetic abbreviations like "EST" or "JST" (not "GMT+5:30"). */
function isShortZoneAbbreviation(zoneName: string): boolean {
  return zoneName.length > 0 && zoneName.length <= 4 && /^[A-Z]+$/.test(zoneName);
}

/**
 * Creates a Timezone object from an IANA timezone ID.
 * Uses @vvo/tzdb for accurate country and city information,
 * and Temporal for current offset calculations (DST-aware).
 */
export function createTimezoneFromId(timezoneId: TimezoneId): Timezone {
  const timezoneMap = getTimezoneMap();
  const tzData = timezoneMap.get(timezoneId);
  const now = Temporal.Now.zonedDateTimeISO(timezoneId);

  const timeZoneName = getShortZoneName(timezoneId, now.toInstant());
  const offsetHours = Math.round(now.offsetNanoseconds / NANOSECONDS_PER_HOUR);
  const offsetDisplay = isShortZoneAbbreviation(timeZoneName)
    ? timeZoneName
    : `UTC${offsetHours >= 0 ? "+" : ""}${offsetHours}`;

  if (tzData) {
    return {
      id: timezoneId,
      city: tzData.mainCities?.[0] || tzData.alternativeName || timezoneId,
      country: tzData.countryName || "",
      countryCode: tzData.countryCode || "",
      offset: offsetDisplay,
      offsetHours,
    };
  }

  // Fallback: parse from IANA ID if not in @vvo/tzdb
  const { displayName } = parseTimezoneId(timezoneId);
  const region = timezoneId.split("/")[0] || "";

  return {
    id: timezoneId,
    city: displayName,
    country: region,
    countryCode: "XX",
    offset: offsetDisplay,
    offsetHours,
  };
}

/**
 * Gets all available timezone IDs from @vvo/tzdb.
 * Returns a comprehensive list of IANA timezone identifiers.
 */
export function getAllTimezoneIds(): string[] {
  try {
    const timezones = getTimezoneData();
    return timezones.map((tz) => tz.name);
  } catch (error) {
    console.error("Failed to load timezones from @vvo/tzdb:", error);
    // Fallback to a minimal list of common timezones
    return [
      "America/New_York",
      "America/Los_Angeles",
      "America/Chicago",
      "America/Denver",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Australia/Sydney",
    ];
  }
}

/** Formats a wall-clock time as "h:mma" (e.g., "2:30pm") or "HH:mm". */
function formatClockTime(
  hour: number,
  minute: number,
  format: "12h" | "24h"
): string {
  const paddedMinute = String(minute).padStart(2, "0");
  if (format === "24h") {
    return `${String(hour).padStart(2, "0")}:${paddedMinute}`;
  }
  const hour12 = ((hour + 11) % 12) + 1;
  const amPm = hour < 12 ? "am" : "pm";
  return `${hour12}:${paddedMinute}${amPm}`;
}

export function formatTime(
  instant: Temporal.Instant,
  timezoneId: TimezoneId,
  format: "12h" | "24h" = "12h"
): string {
  const zdt = instant.toZonedDateTimeISO(timezoneId);
  return formatClockTime(zdt.hour, zdt.minute, format);
}

/** Formats a date as "EEE, MMM d" (e.g., "Mon, Jan 15") in the given timezone. */
export function formatDateDisplay(
  instant: Temporal.Instant,
  timezoneId: TimezoneId
): string {
  return instant.toZonedDateTimeISO(timezoneId).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getOffsetDisplay(
  timezone: Timezone,
  instant: Temporal.Instant = Temporal.Now.instant()
): string {
  const timeZoneName = getShortZoneName(timezone.id, instant);
  if (isShortZoneAbbreviation(timeZoneName)) {
    return timeZoneName;
  }

  const offsetHours = Math.round(
    instant.toZonedDateTimeISO(timezone.id).offsetNanoseconds /
      NANOSECONDS_PER_HOUR
  );
  return `${offsetHours >= 0 ? "+" : ""}${offsetHours}`;
}

export function createTimezoneDisplay(
  timezone: Timezone,
  instant: Temporal.Instant = Temporal.Now.instant(),
  timeFormat: "12h" | "24h" = "12h"
): TimezoneDisplay {
  return {
    timezone,
    formattedTime: formatTime(instant, timezone.id, timeFormat),
    formattedDate: formatDateDisplay(instant, timezone.id),
    offsetDisplay: getOffsetDisplay(timezone, instant),
  };
}

export function getTimeOfDay(hour: number): "day" | "evening" | "night" {
  if (hour >= 6 && hour < 18) {
    return "day";
  }
  if (hour >= 18 && hour < 22) {
    return "evening";
  }
  return "night";
}

/**
 * Returns 24 consecutive hour marks for the given calendar date in the target
 * timezone, starting at (or just after, on DST-gap days) local midnight.
 * Each entry is a ZonedDateTime, so consumers can read wall-clock components
 * directly or convert to another timezone via withTimeZone().
 */
export function getTimelineHours(
  timezoneId: TimezoneId,
  date: Temporal.PlainDate
): Temporal.ZonedDateTime[] {
  const midnight = date.toZonedDateTime(timezoneId);
  return Array.from({ length: 24 }, (_, i) => midnight.add({ hours: i }));
}
