import type { CommandAction } from "@/lib/llm-command-schema";
import { parseTimezoneId } from "@/lib/timezone";

export interface CommandActionHandlers {
  addTimezone: (timezoneId: string) => void;
  removeTimezone: (timezoneId: string) => void;
  setHomeTimezone: (timezoneId: string) => void;
  reorderTimezones: (timezoneIds: string[]) => void;
}

export interface ExecuteCommandActionsInput {
  actions: CommandAction[];
  /** IDs currently displayed, in display order. */
  activeTimezoneIds: string[];
  /** Full set of valid IANA IDs the app recognizes. */
  validTimezoneIds: ReadonlySet<string>;
  maxTimezones: number;
  handlers: CommandActionHandlers;
}

export interface CommandActionResult {
  appliedCount: number;
  failures: string[];
  /** Human-readable descriptions of applied actions, e.g. "Added Tokyo". */
  summaries: string[];
}

function normalizeTimezoneId(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Strip common trailing/leading punctuation when the model leaks JSON tokens.
  const cleaned = trimmed.replace(
    /^[^A-Za-z0-9_+\-/]+|[^A-Za-z0-9_+\-/]+$/g,
    "",
  );
  return cleaned || null;
}

function getTimezoneLabel(timezoneId: string): string {
  return parseTimezoneId(timezoneId).displayName || timezoneId;
}

/**
 * Applies model-returned actions against current state, re-validating every
 * action client-side (the model output is untrusted). Returns applied counts,
 * failures, and human-readable summaries for UI feedback.
 */
export function executeCommandActions({
  actions,
  activeTimezoneIds,
  validTimezoneIds,
  maxTimezones,
  handlers,
}: ExecuteCommandActionsInput): CommandActionResult {
  const currentIds = new Set(activeTimezoneIds);
  const failures: string[] = [];
  const summaries: string[] = [];
  let appliedCount = 0;

  for (const action of actions) {
    if (action.type === "add_timezone") {
      const timezoneId = normalizeTimezoneId(action.timezoneId);
      if (!timezoneId) {
        failures.push("Missing timezone ID for add action.");
        continue;
      }
      if (!validTimezoneIds.has(timezoneId)) {
        failures.push(`Unknown timezone: ${action.timezoneId}.`);
        continue;
      }
      if (currentIds.has(timezoneId)) {
        failures.push(`${timezoneId} is already added.`);
        continue;
      }
      if (currentIds.size >= maxTimezones) {
        failures.push(`Maximum of ${maxTimezones} timezones reached.`);
        continue;
      }
      handlers.addTimezone(timezoneId);
      currentIds.add(timezoneId);
      appliedCount += 1;
      summaries.push(`Added ${getTimezoneLabel(timezoneId)}`);
      continue;
    }

    if (action.type === "remove_timezone") {
      const timezoneId = normalizeTimezoneId(action.timezoneId);
      if (!timezoneId) {
        failures.push("Missing timezone ID for remove action.");
        continue;
      }
      if (!currentIds.has(timezoneId)) {
        failures.push(`${timezoneId} is not currently shown.`);
        continue;
      }
      handlers.removeTimezone(timezoneId);
      currentIds.delete(timezoneId);
      appliedCount += 1;
      summaries.push(`Removed ${getTimezoneLabel(timezoneId)}`);
      continue;
    }

    if (action.type === "clear_all") {
      if (currentIds.size === 0) {
        failures.push("Nothing to clear.");
        continue;
      }
      for (const timezoneId of currentIds) {
        handlers.removeTimezone(timezoneId);
      }
      currentIds.clear();
      appliedCount += 1;
      summaries.push("Cleared all timezones");
      continue;
    }

    if (action.type === "set_home_timezone") {
      const timezoneId = normalizeTimezoneId(action.timezoneId);
      if (!timezoneId) {
        failures.push("Missing timezone ID for home timezone action.");
        continue;
      }
      // Auto-add the timezone when it isn't displayed yet, so commands
      // like "Set home to UTC" work without a separate add step.
      if (!currentIds.has(timezoneId)) {
        if (!validTimezoneIds.has(timezoneId)) {
          failures.push(`Unknown timezone: ${action.timezoneId}.`);
          continue;
        }
        if (currentIds.size >= maxTimezones) {
          failures.push(
            `Cannot set home timezone. Maximum of ${maxTimezones} timezones reached.`,
          );
          continue;
        }
        handlers.addTimezone(timezoneId);
        currentIds.add(timezoneId);
      }
      handlers.setHomeTimezone(timezoneId);
      appliedCount += 1;
      summaries.push(`Set home to ${getTimezoneLabel(timezoneId)}`);
      continue;
    }

    if (action.type === "reorder_timezones") {
      if (!action.timezoneIds) {
        failures.push("Missing timezone IDs for reorder action.");
        continue;
      }
      const normalizedIds = action.timezoneIds
        .map((timezoneId) => normalizeTimezoneId(timezoneId))
        .filter((timezoneId): timezoneId is string => Boolean(timezoneId));

      if (normalizedIds.length !== currentIds.size) {
        failures.push(
          "Reorder action must include all currently displayed timezones.",
        );
        continue;
      }
      // Duplicate ids would pass the length check while omitting another
      // timezone, which would silently drop it from the list.
      if (new Set(normalizedIds).size !== normalizedIds.length) {
        failures.push("Reorder action must list each timezone exactly once.");
        continue;
      }
      const hasUnknownTimezone = normalizedIds.some(
        (timezoneId) => !currentIds.has(timezoneId),
      );
      if (hasUnknownTimezone) {
        failures.push(
          "Reorder action included a timezone not currently displayed.",
        );
        continue;
      }
      handlers.reorderTimezones(normalizedIds);
      appliedCount += 1;
      summaries.push("Reordered timezones");
    }
  }

  return { appliedCount, failures, summaries };
}
