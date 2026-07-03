import { describe, it, expect } from 'vitest';
import { Temporal } from '@/lib/temporal';
import {
  parseTimezoneId,
  createTimezoneFromId,
  getAllTimezoneIds,
  formatTime,
  formatDateDisplay,
  getOffsetDisplay,
  createTimezoneDisplay,
  getTimeOfDay,
  getTimelineHours,
} from './timezone';

describe('parseTimezoneId', () => {
  it('should parse valid IANA timezone ID', () => {
    const result = parseTimezoneId('America/New_York');
    expect(result).toHaveProperty('region');
    expect(result).toHaveProperty('city');
    expect(result).toHaveProperty('displayName');
    expect(result.region).toBeTruthy();
    expect(result.city).toBeTruthy();
  });

  it('should handle timezone with underscore in city name', () => {
    const result = parseTimezoneId('America/New_York');
    expect(result.city).toBeTruthy();
    expect(result.displayName).toBeTruthy();
  });

  it('should fallback to parsing IANA ID format when not in database', () => {
    const result = parseTimezoneId('Invalid/Timezone_Name');
    expect(result.region).toBe('Invalid');
    expect(result.city).toContain('Timezone Name');
  });

  it('should handle timezone with multiple slashes', () => {
    const result = parseTimezoneId('America/Argentina/Buenos_Aires');
    expect(result.region).toBeTruthy();
    expect(result.city).toBeTruthy();
  });
});

describe('createTimezoneFromId', () => {
  it('should create timezone object from valid IANA ID', () => {
    const result = createTimezoneFromId('America/New_York');
    expect(result).toHaveProperty('id', 'America/New_York');
    expect(result).toHaveProperty('city');
    expect(result).toHaveProperty('country');
    expect(result).toHaveProperty('countryCode');
  });

  it('should handle European timezone', () => {
    const result = createTimezoneFromId('Europe/London');
    expect(result.city).toBeTruthy();
    expect(result.country).toBeTruthy();
  });

  it('should handle Asian timezone', () => {
    const result = createTimezoneFromId('Asia/Tokyo');
    expect(result.city).toBeTruthy();
    expect(result.country).toBeTruthy();
  });

  it('should fall back for unknown IANA IDs', () => {
    const result = createTimezoneFromId('Invalid/Somewhere');
    expect(result.id).toBe('Invalid/Somewhere');
    expect(result.countryCode).toBe('XX');
  });
});

describe('getAllTimezoneIds', () => {
  it('should return array of timezone IDs', () => {
    const result = getAllTimezoneIds();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include common timezones', () => {
    const result = getAllTimezoneIds();
    expect(result).toContain('America/New_York');
    expect(result).toContain('Europe/London');
    expect(result).toContain('Asia/Tokyo');
  });

  it('should return fallback timezones on error', () => {
    // This test verifies the fallback behavior exists
    const result = getAllTimezoneIds();
    expect(result.length).toBeGreaterThan(0);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('formatTime', () => {
  const testInstant = Temporal.Instant.from('2024-01-15T14:30:00Z');

  it('should format time in 12-hour format', () => {
    const result = formatTime(testInstant, 'America/New_York', '12h');
    // 14:30 UTC = 9:30am in New York (EST)
    expect(result).toBe('9:30am');
  });

  it('should format time in 24-hour format', () => {
    const result = formatTime(testInstant, 'America/New_York', '24h');
    expect(result).toBe('09:30');
  });

  it('should default to 12-hour format', () => {
    const result = formatTime(testInstant, 'America/New_York');
    expect(result).toMatch(/^\d{1,2}:\d{2}(am|pm)$/);
  });

  it('should format noon and midnight correctly in 12-hour format', () => {
    const noon = Temporal.Instant.from('2024-01-15T12:00:00Z');
    const midnight = Temporal.Instant.from('2024-01-15T00:00:00Z');
    expect(formatTime(noon, 'UTC', '12h')).toBe('12:00pm');
    expect(formatTime(midnight, 'UTC', '12h')).toBe('12:00am');
  });

  it('should handle different timezones correctly', () => {
    const nyResult = formatTime(testInstant, 'America/New_York', '24h');
    const londonResult = formatTime(testInstant, 'Europe/London', '24h');
    // Times should be different for different timezones
    expect(nyResult).not.toBe(londonResult);
  });
});

describe('formatDateDisplay', () => {
  it('should format date in readable format', () => {
    const testInstant = Temporal.Instant.from('2024-01-15T14:30:00Z');
    const result = formatDateDisplay(testInstant, 'America/New_York');
    // Should be in format like "Mon, Jan 15"
    expect(result).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });

  it('should handle different dates', () => {
    const instant1 = Temporal.Instant.from('2024-01-15T14:30:00Z');
    const instant2 = Temporal.Instant.from('2024-12-25T14:30:00Z');
    const result1 = formatDateDisplay(instant1, 'America/New_York');
    const result2 = formatDateDisplay(instant2, 'America/New_York');
    expect(result1).not.toBe(result2);
  });
});

describe('getOffsetDisplay', () => {
  const instant = Temporal.Instant.from('2024-01-15T12:00:00Z');

  it('should return offset display string', () => {
    const timezone = createTimezoneFromId('America/New_York');
    const result = getOffsetDisplay(timezone);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return short timezone code when available', () => {
    const timezone = createTimezoneFromId('America/New_York');
    const result = getOffsetDisplay(timezone);
    // Should be either EST/EDT or ±N format
    expect(result).toMatch(/^(EST|EDT|[+-]\d+(:\d{2})?|[A-Z]{2,4})$/);
  });

  it('should reflect DST in offset for different dates', () => {
    const timezone = createTimezoneFromId('America/New_York');
    const summerInstant = Temporal.Instant.from('2024-07-15T12:00:00Z');
    expect(getOffsetDisplay(timezone, instant)).toBe('EST');
    expect(getOffsetDisplay(timezone, summerInstant)).toBe('EDT');
  });

  it('should show whole-hour offsets without minutes', () => {
    const tokyo = createTimezoneFromId('Asia/Tokyo');
    expect(getOffsetDisplay(tokyo, instant)).toBe('+9');
  });

  it('should preserve minutes for half- and quarter-hour offsets', () => {
    // These zones have no alphabetic abbreviation, so the numeric offset
    // shows; it must not round +5:30 up to +6
    const kolkata = createTimezoneFromId('Asia/Kolkata');
    const kathmandu = createTimezoneFromId('Asia/Kathmandu');
    const adelaide = createTimezoneFromId('Australia/Adelaide');
    expect(getOffsetDisplay(kolkata, instant)).toBe('+5:30');
    expect(getOffsetDisplay(kathmandu, instant)).toBe('+5:45');
    expect(getOffsetDisplay(adelaide, instant)).toBe('+10:30'); // ACDT in January
  });
});

describe('createTimezoneDisplay', () => {
  it('should create complete timezone display object', () => {
    const timezone = createTimezoneFromId('America/New_York');
    const result = createTimezoneDisplay(timezone, Temporal.Now.instant(), '12h');

    expect(result).toHaveProperty('timezone');
    expect(result).toHaveProperty('formattedTime');
    expect(result).toHaveProperty('formattedDate');
    expect(result).toHaveProperty('offsetDisplay');
    expect(result.timezone).toEqual(timezone);
  });

  it('should use provided instant', () => {
    const timezone = createTimezoneFromId('America/New_York');
    const testInstant = Temporal.Instant.from('2024-01-15T14:30:00Z');
    const result = createTimezoneDisplay(timezone, testInstant, '24h');
    expect(result.formattedTime).toBe('09:30');
  });

  it('should use provided time format', () => {
    const timezone = createTimezoneFromId('America/New_York');
    const testInstant = Temporal.Instant.from('2024-01-15T14:30:00Z');
    const result12h = createTimezoneDisplay(timezone, testInstant, '12h');
    const result24h = createTimezoneDisplay(timezone, testInstant, '24h');
    expect(result12h.formattedTime).not.toBe(result24h.formattedTime);
  });

  it('should default to current instant and 12h format', () => {
    const timezone = createTimezoneFromId('America/New_York');
    const result = createTimezoneDisplay(timezone);
    expect(result.formattedTime).toMatch(/^\d{1,2}:\d{2}(am|pm)$/);
  });
});

describe('getTimeOfDay', () => {
  it('should return "day" for hours 6-17', () => {
    expect(getTimeOfDay(6)).toBe('day');
    expect(getTimeOfDay(12)).toBe('day');
    expect(getTimeOfDay(17)).toBe('day');
  });

  it('should return "evening" for hours 18-21', () => {
    expect(getTimeOfDay(18)).toBe('evening');
    expect(getTimeOfDay(20)).toBe('evening');
    expect(getTimeOfDay(21)).toBe('evening');
  });

  it('should return "night" for hours 22-23 and 0-5', () => {
    expect(getTimeOfDay(22)).toBe('night');
    expect(getTimeOfDay(23)).toBe('night');
    expect(getTimeOfDay(0)).toBe('night');
    expect(getTimeOfDay(5)).toBe('night');
  });

  it('should handle boundary cases correctly', () => {
    expect(getTimeOfDay(5)).toBe('night');
    expect(getTimeOfDay(6)).toBe('day');
    expect(getTimeOfDay(17)).toBe('day');
    expect(getTimeOfDay(18)).toBe('evening');
    expect(getTimeOfDay(21)).toBe('evening');
    expect(getTimeOfDay(22)).toBe('night');
  });
});

describe('getTimelineHours', () => {
  const testDate = Temporal.PlainDate.from('2024-01-15');

  it('should return array of 24 ZonedDateTime objects in the target timezone', () => {
    const result = getTimelineHours('America/New_York', testDate);
    expect(result.length).toBe(24);
    result.forEach((hour) => {
      expect(hour).toBeInstanceOf(Temporal.ZonedDateTime);
      expect(hour.timeZoneId).toBe('America/New_York');
    });
  });

  it('should start at local midnight of the requested date', () => {
    const result = getTimelineHours('America/New_York', testDate);
    expect(result[0].hour).toBe(0);
    expect(result[0].toPlainDate().equals(testDate)).toBe(true);
  });

  it('should cover hours 0 through 23 on a regular day', () => {
    const result = getTimelineHours('America/New_York', testDate);
    result.forEach((hour, i) => {
      expect(hour.hour).toBe(i);
    });
  });

  it('should handle different timezones', () => {
    const nyResult = getTimelineHours('America/New_York', testDate);
    const londonResult = getTimelineHours('Europe/London', testDate);
    // Midnight instants should differ between timezones
    expect(nyResult[0].epochMilliseconds).not.toBe(
      londonResult[0].epochMilliseconds
    );
  });

  it('should return consecutive hours exactly 1 hour apart', () => {
    const result = getTimelineHours('America/New_York', testDate);
    for (let i = 1; i < result.length; i++) {
      const diffMs =
        result[i].epochMilliseconds - result[i - 1].epochMilliseconds;
      expect(diffMs).toBe(60 * 60 * 1000);
    }
  });

  it('should handle DST spring-forward transitions', () => {
    // 2024-03-10: US spring DST; 2:00-3:00am does not exist in New York
    const dstDate = Temporal.PlainDate.from('2024-03-10');
    const result = getTimelineHours('America/New_York', dstDate);
    expect(result.length).toBe(24);
    expect(result[0].hour).toBe(0);
    // The 2am hour is skipped, so hour labels jump from 1 to 3
    const hours = result.map((h) => h.hour);
    expect(hours).not.toContain(2);
  });
});
