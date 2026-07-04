"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import type { TimeZone } from "@vvo/tzdb";
import { Temporal } from "@/lib/temporal";
import { useTimezone } from "@/contexts/timezone-context";
import { getAllTimezoneIds, parseTimezoneId, formatTime } from "@/lib/timezone";
import { getTimezoneMap } from "@/lib/timezone-data";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

/**
 * Searchable timezone picker component that allows users to search
 * and select from all available IANA timezones using @vvo/tzdb data.
 * Enhanced search supports city names, country names, alternative names, and IANA IDs.
 */
export function TimezonePicker() {
  const { addTimezone, timezoneDisplays, timeFormat } = useTimezone();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Temporal.Now.instant());
  const isMobile = useIsMobile();

  // Update current time every minute when dropdown is open
  useEffect(() => {
    if (!open) return;

    // Update immediately
    setCurrentTime(Temporal.Now.instant());

    // Then update every minute
    const interval = setInterval(() => {
      setCurrentTime(Temporal.Now.instant());
    }, 60000);

    return () => clearInterval(interval);
  }, [open]);

  // Get timezone data map from shared service
  const timezoneDataMap = useMemo(() => {
    try {
      return getTimezoneMap();
    } catch (error) {
      console.error("Failed to load timezone data:", error);
      return new Map<string, TimeZone>();
    }
  }, []);

  // Get all timezone IDs and group them by continent/region
  const timezonesByRegion = useMemo(() => {
    const allIds = getAllTimezoneIds();
    const existingIds = new Set(timezoneDisplays.map((d) => d.timezone.id));

    // Filter out already added timezones
    const availableIds = allIds.filter((id) => !existingIds.has(id));

    // Group by continent/region using @vvo/tzdb data
    const grouped: Record<string, string[]> = {};

    availableIds.forEach((id) => {
      const tzData = timezoneDataMap.get(id);
      const region =
        tzData?.continentName || parseTimezoneId(id).region || "Other";

      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(id);
    });

    // Sort regions and timezones within each region
    const sortedRegions = Object.keys(grouped).sort();
    const sorted: Record<string, string[]> = {};

    sortedRegions.forEach((region) => {
      sorted[region] = grouped[region].sort();
    });

    return sorted;
  }, [timezoneDisplays, timezoneDataMap]);

  // Enhanced filter: searches city, country, alternative name, and IANA ID
  const filteredTimezonesByRegion = useMemo(() => {
    if (!search.trim()) {
      return timezonesByRegion;
    }

    const query = search.toLowerCase();
    const filtered: Record<string, string[]> = {};

    Object.entries(timezonesByRegion).forEach(([region, ids]) => {
      const matchingIds = ids.filter((id) => {
        const tzData = timezoneDataMap.get(id);

        // Search in multiple fields for better results
        if (tzData) {
          const cityMatch = tzData.mainCities?.some((city) =>
            city.toLowerCase().includes(query),
          );
          const countryMatch = tzData.countryName
            ?.toLowerCase()
            .includes(query);
          const altNameMatch = tzData.alternativeName
            ?.toLowerCase()
            .includes(query);
          const idMatch = id.toLowerCase().includes(query);
          const regionMatch = region.toLowerCase().includes(query);

          return (
            cityMatch || countryMatch || altNameMatch || idMatch || regionMatch
          );
        }

        // Fallback to basic parsing if @vvo/tzdb data not available
        const { city } = parseTimezoneId(id);
        return (
          city.toLowerCase().includes(query) ||
          region.toLowerCase().includes(query) ||
          id.toLowerCase().includes(query)
        );
      });

      if (matchingIds.length > 0) {
        filtered[region] = matchingIds;
      }
    });

    return filtered;
  }, [timezonesByRegion, search, timezoneDataMap]);

  const handleSelect = (timezoneId: string) => {
    addTimezone(timezoneId);
    setOpen(false);
    setSearch("");
  };

  // Shared content component to avoid duplication
  const pickerContent = (
    <Command
      shouldFilter={false}
      className="bg-white dark:bg-stone-900 [&_[data-cmdk-input-wrapper]]:border-slate-200 dark:[&_[data-cmdk-input-wrapper]]:border-stone-700 flex flex-col h-full min-h-0"
    >
      <CommandInput
        placeholder="Search timezones..."
        value={search}
        onValueChange={setSearch}
        className="h-11 shrink-0"
      />
      <CommandList
        className={cn(
          "p-1 flex-1 overflow-y-auto min-h-0",
          isMobile ? "" : "max-h-[400px]",
        )}
      >
        <CommandEmpty className="py-8 text-center text-sm text-slate-600 dark:text-stone-400">
          {search.trim() ? "No timezones found." : "No timezones available."}
        </CommandEmpty>
        {Object.entries(filteredTimezonesByRegion).map(([region, ids]) => (
          <CommandGroup
            key={region}
            heading={region}
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-slate-600 dark:[&_[cmdk-group-heading]]:text-stone-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
          >
            {ids.map((timezoneId) => {
              const tzData = timezoneDataMap.get(timezoneId);
              const displayCity =
                tzData?.mainCities?.[0] || parseTimezoneId(timezoneId).city;
              const countryName = tzData?.countryName;
              const timeInTimezone = formatTime(
                currentTime,
                timezoneId,
                timeFormat,
              );

              return (
                <CommandItem
                  key={timezoneId}
                  value={timezoneId}
                  onSelect={() => handleSelect(timezoneId)}
                  className="cursor-pointer px-3 py-2.5 rounded-md transition-colors data-[selected=true]:bg-slate-50 dark:data-[selected=true]:bg-stone-800 data-[selected=true]:text-slate-900 dark:data-[selected=true]:text-stone-100 hover:bg-slate-50 dark:hover:bg-stone-800"
                >
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-900 dark:text-stone-100">
                      {displayCity}
                    </span>
                    {countryName && (
                      <span className="text-xs text-slate-600 dark:text-stone-400">
                        {countryName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 ml-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-stone-300 tabular-nums">
                      {timeInTimezone}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-stone-400 font-mono">
                      {timezoneId}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );

  const triggerButton = (
    <Button
      variant="outline"
      className="h-12 w-full lg:h-9 lg:min-w-[130px] lg:w-auto gap-2 lg:gap-2 rounded-xl lg:rounded-md border-slate-200 dark:border-stone-700 lg:border-slate-300 dark:lg:border-stone-600 bg-white dark:bg-stone-800 text-sm font-medium text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-700 px-4 lg:px-4 touch-manipulation shrink-0 shadow-sm lg:shadow-none"
    >
      <Plus className="h-4 w-4 shrink-0" />
      <span className="text-sm">Add Timezone</span>
    </Button>
  );

  // Use Drawer on mobile, Popover on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="p-0 flex flex-col" open={open}>
          {pickerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-700 shadow-sm"
        align="start"
      >
        {pickerContent}
      </PopoverContent>
    </Popover>
  );
}
