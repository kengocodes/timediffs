import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import { Temporal } from "@/lib/temporal";

/**
 * URL parsers for timezone comparison state.
 * These parsers handle serialization/deserialization of state to/from URL query parameters.
 */

/**
 * Maximum number of timezones allowed to prevent DoS attacks and performance issues.
 * This limit protects against:
 * - Browser performance degradation
 * - Memory exhaustion
 * - UI rendering problems
 */
const MAX_TIMEZONES = 8;

/**
 * Parser for timezone IDs array.
 * Serializes as comma-separated string: "America/New_York,Europe/London"
 * Parses back to array, filtering out empty strings and enforcing maximum limit.
 */
export const parseAsTimezoneArray = {
  parse: (value: string): string[] => {
    const baseParser = parseAsArrayOf(parseAsString).withDefault([]);
    const parsed = baseParser.parse(value);
    // Enforce maximum limit by truncating excess timezones
    // Handle null case (shouldn't happen with withDefault, but TypeScript requires it)
    return (parsed || []).slice(0, MAX_TIMEZONES);
  },
  serialize: (value: string[]): string => {
    const baseParser = parseAsArrayOf(parseAsString).withDefault([]);
    // Ensure we only serialize up to the maximum limit
    const limited = value.slice(0, MAX_TIMEZONES);
    return baseParser.serialize(limited);
  },
  withDefault: (defaultValue: string[]) => ({
    parse: parseAsTimezoneArray.parse,
    serialize: parseAsTimezoneArray.serialize,
    defaultValue: defaultValue.slice(0, MAX_TIMEZONES),
  }),
};

// Export the constant for use in other modules
export { MAX_TIMEZONES };

/**
 * Parser for date selection.
 * Serializes as an ISO calendar date string ("2024-01-15") and parses back to
 * a Temporal.PlainDate. Invalid values parse to null so nuqs falls back to the
 * default. The `eq` option keeps nuqs from treating structurally equal dates
 * as state changes (Temporal objects are compared by reference otherwise).
 */
export const parseAsPlainDate = createParser<Temporal.PlainDate>({
  parse: (value: string): Temporal.PlainDate | null => {
    try {
      return Temporal.PlainDate.from(value, { overflow: "reject" });
    } catch {
      return null;
    }
  },
  serialize: (value: Temporal.PlainDate): string => value.toString(),
  eq: (a: Temporal.PlainDate, b: Temporal.PlainDate): boolean => a.equals(b),
});

/**
 * Parser for time format selection.
 * Only accepts "12h" or "24h" values.
 */
export const parseAsTimeFormat = parseAsStringEnum([
  "12h",
  "24h",
] as const).withDefault("12h");

/**
 * Parser for home timezone ID.
 * Single string value, optional (can be null).
 */
export const parseAsHomeTimezone = parseAsString;
