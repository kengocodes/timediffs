"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "indigo" | "blossom";

export const THEMES: Theme[] = ["light", "dark", "indigo", "blossom"];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "timediffs-theme";

/**
 * Per-theme configuration. `mode` determines which base class (light/dark)
 * is applied so existing `dark:` Tailwind variants keep working; themed
 * palettes additionally get a `theme-*` class that retints the colors.
 */
export const THEME_CONFIG: Record<
  Theme,
  { label: string; mode: "light" | "dark"; metaColor: string }
> = {
  light: { label: "Light", mode: "light", metaColor: "#ffffff" },
  dark: { label: "Dark", mode: "dark", metaColor: "#1c1917" },
  indigo: { label: "Indigo", mode: "dark", metaColor: "#0a1524" },
  blossom: { label: "Blossom", mode: "light", metaColor: "#fdf2f5" },
};

function isTheme(value: string | null): value is Theme {
  return value !== null && (THEMES as string[]).includes(value);
}

/**
 * Gets the system preferred color scheme.
 */
function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Theme provider component that manages the color theme with:
 * - localStorage persistence
 * - System preference detection as default (light/dark)
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    setThemeState(isTheme(stored) ? stored : getSystemTheme());
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove(
      "light",
      "dark",
      ...THEMES.map((t) => `theme-${t}`)
    );
    const config = THEME_CONFIG[theme];
    root.classList.add(config.mode);
    if (theme !== "light" && theme !== "dark") {
      root.classList.add(`theme-${theme}`);
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", config.metaColor);
    }
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  // Children render immediately (including on the server) so the app is
  // never blanked while waiting for hydration. The inline script in
  // app/layout.tsx applies the persisted theme class before first paint,
  // and the effects above take over once mounted.
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context.
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
