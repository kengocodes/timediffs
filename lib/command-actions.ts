import type { CommandAction } from "@/lib/llm-command-schema";
import { parseTimezoneId } from "@/lib/timezone";

export interface CommandActionHandlers {
  /**
   * Applies the final timezone list (ordered) and optional home timezone in
   * a single state update. The executor computes the end state of all
   * actions first and commits once: issuing one URL-state update per action
   * within the same tick makes each functional update read the same stale
   * snapshot, so later updates clobber earlier ones.
   */
  setTimezones: (timezoneIds: string[], homeTimezoneId?: string) => void;
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
 * action client-side (the model output is untrusted). Bulk actions
 * (add_timezones, remove_timezones, replace_all) apply partially: valid IDs
 * are applied and invalid ones are reported as failures.
 *
 * All actions are folded into one final list, committed via a single
 * handlers.setTimezones call. Returns applied counts, failures, and
 * human-readable summaries for UI feedback.
 */
export function executeCommandActions({
  actions,
  activeTimezoneIds,
  validTimezoneIds,
  maxTimezones,
  handlers,
}: ExecuteCommandActionsInput): CommandActionResult {
  // Working copy of the displayed list; every action reads and mutates this
  // so later actions see earlier changes.
  let orderedIds = [...activeTimezoneIds];
  let homeTimezoneId: string | undefined;
  const failures: string[] = [];
  const summaries: string[] = [];
  let appliedCount = 0;

  /** Validates and applies one add. Returns the display label on success. */
  const tryAddTimezone = (rawId: string | null): string | null => {
    const timezoneId = normalizeTimezoneId(rawId);
    if (!timezoneId) {
      failures.push("Missing timezone ID for add action.");
      return null;
    }
    if (!validTimezoneIds.has(timezoneId)) {
      failures.push(`Unknown timezone: ${rawId}.`);
      return null;
    }
    if (orderedIds.includes(timezoneId)) {
      failures.push(`${timezoneId} is already added.`);
      return null;
    }
    if (orderedIds.length >= maxTimezones) {
      failures.push(`Maximum of ${maxTimezones} timezones reached.`);
      return null;
    }
    orderedIds.push(timezoneId);
    return getTimezoneLabel(timezoneId);
  };

  /** Validates and applies one remove. Returns the display label on success. */
  const tryRemoveTimezone = (rawId: string | null): string | null => {
    const timezoneId = normalizeTimezoneId(rawId);
    if (!timezoneId) {
      failures.push("Missing timezone ID for remove action.");
      return null;
    }
    if (!orderedIds.includes(timezoneId)) {
      failures.push(`${timezoneId} is not currently shown.`);
      return null;
    }
    orderedIds = orderedIds.filter((id) => id !== timezoneId);
    return getTimezoneLabel(timezoneId);
  };

  const applyAdds = (rawIds: (string | null)[]) => {
    const labels = rawIds
      .map((rawId) => tryAddTimezone(rawId))
      .filter((label): label is string => label !== null);
    if (labels.length > 0) {
      appliedCount += labels.length;
      summaries.push(`Added ${labels.join(", ")}`);
    }
  };

  const applyRemovals = (rawIds: (string | null)[]) => {
    const labels = rawIds
      .map((rawId) => tryRemoveTimezone(rawId))
      .filter((label): label is string => label !== null);
    if (labels.length > 0) {
      appliedCount += labels.length;
      summaries.push(`Removed ${labels.join(", ")}`);
    }
  };

  /** Replaces the displayed list with targetIds (order included). */
  const applyReplaceAll = (rawIds: (string | null)[]) => {
    const targetIds: string[] = [];
    for (const rawId of rawIds) {
      const timezoneId = normalizeTimezoneId(rawId);
      if (!timezoneId || targetIds.includes(timezoneId)) {
        continue;
      }
      if (!validTimezoneIds.has(timezoneId)) {
        failures.push(`Unknown timezone: ${rawId}.`);
        continue;
      }
      if (targetIds.length >= maxTimezones) {
        failures.push(`Maximum of ${maxTimezones} timezones reached.`);
        break;
      }
      targetIds.push(timezoneId);
    }

    if (targetIds.length === 0) {
      failures.push("No valid timezones to replace the list with.");
      return;
    }

    orderedIds = targetIds;
    appliedCount += 1;
    summaries.push(
      `Replaced list with ${targetIds.map(getTimezoneLabel).join(", ")}`,
    );
  };

  const applySetHomeTimezone = (rawId: string | null) => {
    const timezoneId = normalizeTimezoneId(rawId);
    if (!timezoneId) {
      failures.push("Missing timezone ID for home timezone action.");
      return;
    }
    // Auto-add the timezone when it isn't displayed yet, so commands
    // like "Set home to UTC" work without a separate add step.
    if (!orderedIds.includes(timezoneId)) {
      if (!validTimezoneIds.has(timezoneId)) {
        failures.push(`Unknown timezone: ${rawId}.`);
        return;
      }
      if (orderedIds.length >= maxTimezones) {
        failures.push(
          `Cannot set home timezone. Maximum of ${maxTimezones} timezones reached.`,
        );
        return;
      }
      orderedIds.push(timezoneId);
    }
    homeTimezoneId = timezoneId;
    appliedCount += 1;
    summaries.push(`Set home to ${getTimezoneLabel(timezoneId)}`);
  };

  const applyClearAll = () => {
    if (orderedIds.length === 0) {
      failures.push("Nothing to clear.");
      return;
    }
    orderedIds = [];
    appliedCount += 1;
    summaries.push("Cleared all timezones");
  };

  const applyReorder = (rawIds: (string | null)[]) => {
    const normalizedIds = rawIds
      .map((timezoneId) => normalizeTimezoneId(timezoneId))
      .filter((timezoneId): timezoneId is string => Boolean(timezoneId));

    if (normalizedIds.length !== orderedIds.length) {
      failures.push(
        "Reorder action must include all currently displayed timezones.",
      );
      return;
    }
    // Duplicate ids would pass the length check while omitting another
    // timezone, which would silently drop it from the list.
    if (new Set(normalizedIds).size !== normalizedIds.length) {
      failures.push("Reorder action must list each timezone exactly once.");
      return;
    }
    const hasUnknownTimezone = normalizedIds.some(
      (timezoneId) => !orderedIds.includes(timezoneId),
    );
    if (hasUnknownTimezone) {
      failures.push(
        "Reorder action included a timezone not currently displayed.",
      );
      return;
    }
    orderedIds = normalizedIds;
    appliedCount += 1;
    summaries.push("Reordered timezones");
  };

  for (const action of actions) {
    switch (action.type) {
      case "add_timezone":
        applyAdds([action.timezoneId]);
        break;
      case "add_timezones":
        applyAdds(action.timezoneIds ?? []);
        break;
      case "remove_timezone":
        applyRemovals([action.timezoneId]);
        break;
      case "remove_timezones":
        applyRemovals(action.timezoneIds ?? []);
        break;
      case "replace_all":
        applyReplaceAll(action.timezoneIds ?? []);
        break;
      case "set_home_timezone":
        applySetHomeTimezone(action.timezoneId);
        break;
      case "clear_all":
        applyClearAll();
        break;
      case "reorder_timezones":
        applyReorder(action.timezoneIds ?? []);
        break;
      default: {
        const _exhaustive: never = action.type;
        failures.push(`Unsupported action: ${String(_exhaustive)}.`);
      }
    }
  }

  if (appliedCount > 0) {
    handlers.setTimezones(orderedIds, homeTimezoneId);
  }

  return { appliedCount, failures, summaries };
}
