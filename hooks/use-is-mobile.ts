"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's `lg` breakpoint: mobile is anything below 1024px
const MOBILE_QUERY = "(max-width: 1023px)";

function subscribe(onStoreChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(MOBILE_QUERY);
  // Fires only when the breakpoint is crossed, unlike a resize listener
  mediaQueryList.addEventListener("change", onStoreChange);
  return () => mediaQueryList.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

// SSR renders desktop layout; the client corrects on hydration if needed
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hook to detect if the current screen size is mobile (< 1024px).
 * Uses the same breakpoint as Tailwind's `lg` breakpoint.
 * SSR-safe: returns false on server-side to avoid hydration mismatches.
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
