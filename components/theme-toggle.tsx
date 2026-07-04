"use client";

import { useState } from "react";
import { Sun, Moon, Waves, Flower2, Check, type LucideIcon } from "lucide-react";
import { useTheme, THEMES, THEME_CONFIG, type Theme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const THEME_ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  indigo: Waves,
  blossom: Flower2,
};

/** Small gradient swatch previewing each theme's palette. */
const THEME_SWATCHES: Record<Theme, string> = {
  light: "linear-gradient(135deg, #ffffff 50%, #cbd5e1 50%)",
  dark: "linear-gradient(135deg, #292524 50%, #0f0d0c 50%)",
  indigo: "linear-gradient(135deg, #24354d 50%, #0a1524 50%)",
  blossom: "linear-gradient(135deg, #fdf2f5 50%, #f2a8c4 50%)",
};

/**
 * Theme picker button that opens a popover listing all available themes
 * (light, dark, indigo, blossom) with palette previews.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ActiveIcon = THEME_ICONS[theme];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-11 w-11 lg:h-9 lg:w-9 p-0 rounded-lg lg:rounded-md",
            "text-slate-600 dark:text-stone-400",
            "hover:text-slate-900 dark:hover:text-stone-200",
            "hover:bg-slate-100 dark:hover:bg-stone-800",
            "lg:border lg:border-slate-300 dark:lg:border-stone-700",
            "lg:bg-white dark:lg:bg-stone-900",
            "shrink-0 transition-all duration-200"
          )}
          aria-label="Choose theme"
          title="Choose theme"
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-44 p-1.5">
        <div role="radiogroup" aria-label="Theme" className="flex flex-col gap-0.5">
          {THEMES.map((themeOption) => {
            const Icon = THEME_ICONS[themeOption];
            const isActive = theme === themeOption;
            return (
              <button
                type="button"
                key={themeOption}
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(themeOption);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full min-h-11 rounded-md px-2 py-1.5 text-sm",
                  "lg:min-h-0",
                  "transition-colors cursor-pointer touch-manipulation no-tap-highlight",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border border-border shrink-0"
                  style={{ background: THEME_SWATCHES[themeOption] }}
                />
                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="flex-1 text-left">
                  {THEME_CONFIG[themeOption].label}
                </span>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
