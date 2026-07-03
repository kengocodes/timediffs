"use client";

import { useEffect, useMemo, useState } from "react";
import { Temporal } from "@/lib/temporal";
import type { TimezoneDisplay } from "@/types";

type HolidayNameByTimezone = Record<string, string>;

interface HolidayEntry {
  date?: string;
  name?: string;
  type?: string;
}

interface HolidaysInstance {
  getHolidays: (year: number) => HolidayEntry[];
}

type HolidaysConstructor = new (countryCode: string) => HolidaysInstance;

const countryYearHolidayCache = new Map<string, Promise<Map<string, string>>>();
let holidaysConstructorPromise: Promise<HolidaysConstructor | null> | null = null;

function normalizeHolidayDate(value: string): string | null {
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? null;
}

function isCountryCodeSupported(countryCode: string | undefined): countryCode is string {
  return Boolean(countryCode && countryCode !== "XX");
}

async function loadHolidaysConstructor(): Promise<HolidaysConstructor | null> {
  if (!holidaysConstructorPromise) {
    holidaysConstructorPromise = import("date-holidays")
      .then((module) => {
        const candidate = (module as { default?: unknown }).default ?? module;
        return typeof candidate === "function"
          ? (candidate as HolidaysConstructor)
          : null;
      })
      .catch(() => null);
  }

  return holidaysConstructorPromise;
}

async function getPublicHolidayMapForCountryYear(
  countryCode: string,
  year: number
): Promise<Map<string, string>> {
  const cacheKey = `${countryCode}:${year}`;
  const cached = countryYearHolidayCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const loadingPromise = (async () => {
    const Holidays = await loadHolidaysConstructor();
    if (!Holidays) {
      return new Map<string, string>();
    }

    try {
      const holidaysApi = new Holidays(countryCode);
      const holidays = holidaysApi.getHolidays(year);
      const dateToHolidayName = new Map<string, string>();

      for (const holiday of holidays) {
        if (holiday.type !== "public" || !holiday.date || !holiday.name) {
          continue;
        }

        const dateKey = normalizeHolidayDate(holiday.date);
        if (!dateKey || dateToHolidayName.has(dateKey)) {
          continue;
        }

        dateToHolidayName.set(dateKey, holiday.name);
      }

      return dateToHolidayName;
    } catch {
      return new Map<string, string>();
    }
  })();

  countryYearHolidayCache.set(cacheKey, loadingPromise);
  return loadingPromise;
}

function areHolidayMapsEqual(
  left: HolidayNameByTimezone,
  right: HolidayNameByTimezone
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export function useHolidays(
  timezoneDisplays: TimezoneDisplay[],
  instant: Temporal.Instant
): HolidayNameByTimezone {
  const [holidayNamesByTimezone, setHolidayNamesByTimezone] =
    useState<HolidayNameByTimezone>({});

  const lookupData = useMemo(() => {
    const items = timezoneDisplays.map((display) => {
      const localDate = instant
        .toZonedDateTimeISO(display.timezone.id)
        .toPlainDate();

      return {
        timezoneId: display.timezone.id,
        countryCode: display.timezone.countryCode,
        localDate: localDate.toString(), // "yyyy-MM-dd", matching holiday keys
        year: localDate.year,
      };
    });

    const signature = items
      .map(
        ({ timezoneId, countryCode, localDate }) =>
          `${timezoneId}:${countryCode}:${localDate}`
      )
      .join("|");

    return { items, signature };
  }, [timezoneDisplays, instant]);

  useEffect(() => {
    let isCancelled = false;

    const updateHolidays = async () => {
      const entries = await Promise.all(
        lookupData.items.map(async ({ timezoneId, countryCode, localDate, year }) => {
          if (!isCountryCodeSupported(countryCode)) {
            return [timezoneId, undefined] as const;
          }

          const holidayMap = await getPublicHolidayMapForCountryYear(countryCode, year);
          return [timezoneId, holidayMap.get(localDate)] as const;
        })
      );

      if (isCancelled) {
        return;
      }

      const next: HolidayNameByTimezone = {};
      for (const [timezoneId, holidayName] of entries) {
        if (holidayName) {
          next[timezoneId] = holidayName;
        }
      }

      setHolidayNamesByTimezone((previous) =>
        areHolidayMapsEqual(previous, next) ? previous : next
      );
    };

    if (lookupData.items.length === 0) {
      setHolidayNamesByTimezone((previous) =>
        Object.keys(previous).length === 0 ? previous : {}
      );
      return;
    }

    void updateHolidays();

    return () => {
      isCancelled = true;
    };
  }, [lookupData]);

  return holidayNamesByTimezone;
}
