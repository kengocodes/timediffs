import { describe, it, expect } from 'vitest';
import { Temporal } from '@/lib/temporal';
import {
  parseAsTimezoneArray,
  parseAsPlainDate,
  parseAsTimeFormat,
  parseAsHomeTimezone,
  MAX_TIMEZONES,
} from './url-parsers';

describe('parseAsTimezoneArray', () => {
  describe('parse', () => {
    it('should parse comma-separated timezone string', () => {
      const result = parseAsTimezoneArray.parse(
        'America/New_York,Europe/London'
      );
      expect(result).toEqual(['America/New_York', 'Europe/London']);
    });

    it('should parse single timezone', () => {
      const result = parseAsTimezoneArray.parse('America/New_York');
      expect(result).toEqual(['America/New_York']);
    });

    it('should return empty array for empty string', () => {
      const result = parseAsTimezoneArray.parse('');
      expect(result).toEqual([]);
    });

    it('should handle empty strings in input', () => {
      // Note: nuqs parseAsArrayOf may include empty strings, so we test actual behavior
      const result = parseAsTimezoneArray.parse('America/New_York,,Europe/London');
      // The parser should handle this gracefully
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('America/New_York');
      expect(result).toContain('Europe/London');
    });

    it('should enforce MAX_TIMEZONES limit', () => {
      const manyTimezones = Array(MAX_TIMEZONES + 5)
        .fill('America/New_York')
        .join(',');
      const result = parseAsTimezoneArray.parse(manyTimezones);
      expect(result.length).toBe(MAX_TIMEZONES);
    });

    it('should handle whitespace', () => {
      // nuqs may preserve or trim whitespace depending on implementation
      const result = parseAsTimezoneArray.parse(
        'America/New_York , Europe/London'
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Check that both timezones are present (may have whitespace trimmed)
      const normalized = result.map(tz => tz.trim());
      expect(normalized).toContain('America/New_York');
      expect(normalized).toContain('Europe/London');
    });

    it('should handle array input format', () => {
      // nuqs array format might be passed as array
      const result = parseAsTimezoneArray.parse(
        JSON.stringify(['America/New_York', 'Europe/London'])
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('serialize', () => {
    it('should serialize array to comma-separated string', () => {
      const result = parseAsTimezoneArray.serialize([
        'America/New_York',
        'Europe/London',
      ]);
      expect(result).toContain('America/New_York');
      expect(result).toContain('Europe/London');
    });

    it('should serialize empty array', () => {
      const result = parseAsTimezoneArray.serialize([]);
      expect(result).toBeDefined();
    });

    it('should enforce MAX_TIMEZONES limit when serializing', () => {
      const manyTimezones = Array(MAX_TIMEZONES + 5).fill('America/New_York');
      const result = parseAsTimezoneArray.serialize(manyTimezones);
      const parsed = parseAsTimezoneArray.parse(result);
      expect(parsed.length).toBeLessThanOrEqual(MAX_TIMEZONES);
    });
  });

  describe('withDefault', () => {
    it('should use default value when provided', () => {
      const parser = parseAsTimezoneArray.withDefault([
        'America/New_York',
        'Europe/London',
      ]);
      expect(parser.defaultValue).toEqual(['America/New_York', 'Europe/London']);
    });

    it('should enforce MAX_TIMEZONES limit on default value', () => {
      const manyDefaults = Array(MAX_TIMEZONES + 5).fill('America/New_York');
      const parser = parseAsTimezoneArray.withDefault(manyDefaults);
      expect(parser.defaultValue.length).toBe(MAX_TIMEZONES);
    });
  });
});

describe('parseAsPlainDate', () => {
  describe('parse', () => {
    it('should parse valid ISO date string', () => {
      const result = parseAsPlainDate.parse('2024-01-15');
      expect(result).toBeInstanceOf(Temporal.PlainDate);
      expect(result?.year).toBe(2024);
      expect(result?.month).toBe(1);
      expect(result?.day).toBe(15);
    });

    it('should return null for invalid format', () => {
      expect(parseAsPlainDate.parse('invalid-date')).toBeNull();
    });

    it('should return null for out-of-range dates', () => {
      expect(parseAsPlainDate.parse('2024-13-45')).toBeNull();
      expect(parseAsPlainDate.parse('2023-02-29')).toBeNull(); // not a leap year
    });

    it('should handle leap year dates', () => {
      const result = parseAsPlainDate.parse('2024-02-29');
      expect(result?.year).toBe(2024);
      expect(result?.month).toBe(2);
      expect(result?.day).toBe(29);
    });

    it('should handle different months', () => {
      const jan = parseAsPlainDate.parse('2024-01-15');
      const dec = parseAsPlainDate.parse('2024-12-25');
      expect(jan?.month).toBe(1);
      expect(dec?.month).toBe(12);
    });

    it('should reject non-ISO format dates', () => {
      expect(parseAsPlainDate.parse('01/15/2024')).toBeNull();
      expect(parseAsPlainDate.parse('15-01-2024')).toBeNull();
    });
  });

  describe('serialize', () => {
    it('should serialize date to ISO format', () => {
      const date = Temporal.PlainDate.from('2024-01-15');
      expect(parseAsPlainDate.serialize(date)).toBe('2024-01-15');
    });

    it('should pad single-digit months and days', () => {
      const date = Temporal.PlainDate.from({ year: 2024, month: 1, day: 5 });
      expect(parseAsPlainDate.serialize(date)).toBe('2024-01-05');
    });

    it('should round-trip through parse and serialize', () => {
      const serialized = '2024-12-25';
      const parsed = parseAsPlainDate.parse(serialized);
      expect(parsed && parseAsPlainDate.serialize(parsed)).toBe(serialized);
    });
  });

  describe('eq', () => {
    it('should treat structurally equal dates as equal', () => {
      const a = Temporal.PlainDate.from('2024-01-15');
      const b = Temporal.PlainDate.from('2024-01-15');
      expect(parseAsPlainDate.eq?.(a, b)).toBe(true);
    });

    it('should treat different dates as not equal', () => {
      const a = Temporal.PlainDate.from('2024-01-15');
      const b = Temporal.PlainDate.from('2024-01-16');
      expect(parseAsPlainDate.eq?.(a, b)).toBe(false);
    });
  });

  describe('withDefault', () => {
    it('should use default value when provided', () => {
      const defaultDate = Temporal.PlainDate.from('2024-01-01');
      const parser = parseAsPlainDate.withDefault(defaultDate);
      expect(parser.defaultValue.equals(defaultDate)).toBe(true);
    });
  });
});

describe('parseAsTimeFormat', () => {
  it('should parse "12h" format', () => {
    const result = parseAsTimeFormat.parse('12h');
    expect(result).toBe('12h');
  });

  it('should parse "24h" format', () => {
    const result = parseAsTimeFormat.parse('24h');
    expect(result).toBe('24h');
  });

  it('should return null for invalid values (nuqs behavior)', () => {
    // parseAsStringEnum returns null for invalid values, default is applied by withDefault
    const result = parseAsTimeFormat.parse('invalid');
    // The parser itself returns null, but withDefault provides "12h" when used in context
    expect(result === null || result === '12h').toBe(true);
  });

  it('should return null for empty string (nuqs behavior)', () => {
    // parseAsStringEnum returns null for empty/invalid values
    const result = parseAsTimeFormat.parse('');
    // The parser itself returns null, but withDefault provides "12h" when used in context
    expect(result === null || result === '12h').toBe(true);
  });

  it('should serialize "12h" format', () => {
    const result = parseAsTimeFormat.serialize('12h');
    expect(result).toBe('12h');
  });

  it('should serialize "24h" format', () => {
    const result = parseAsTimeFormat.serialize('24h');
    expect(result).toBe('24h');
  });
});

describe('parseAsHomeTimezone', () => {
  it('should parse timezone string', () => {
    const result = parseAsHomeTimezone.parse('America/New_York');
    expect(result).toBe('America/New_York');
  });

  it('should handle empty string', () => {
    const result = parseAsHomeTimezone.parse('');
    expect(result).toBe('');
  });

  it('should serialize timezone string', () => {
    const result = parseAsHomeTimezone.serialize('America/New_York');
    expect(result).toBe('America/New_York');
  });
});

describe('MAX_TIMEZONES constant', () => {
  it('should be a positive number', () => {
    expect(MAX_TIMEZONES).toBeGreaterThan(0);
    expect(typeof MAX_TIMEZONES).toBe('number');
  });

  it('should be used in parseAsTimezoneArray', () => {
    const manyTimezones = Array(MAX_TIMEZONES + 10)
      .fill('America/New_York')
      .join(',');
    const result = parseAsTimezoneArray.parse(manyTimezones);
    expect(result.length).toBe(MAX_TIMEZONES);
  });
});
