import { describe, expect, it, vi } from "vitest";
import type { CommandAction } from "./llm-command-schema";
import {
  executeCommandActions,
  type CommandActionHandlers,
} from "./command-actions";

const VALID_IDS: ReadonlySet<string> = new Set([
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
]);

const MAX = 8;

function run(actions: CommandAction[], activeTimezoneIds: string[]) {
  const handlers: CommandActionHandlers = { setTimezones: vi.fn() };
  const result = executeCommandActions({
    actions,
    activeTimezoneIds,
    validTimezoneIds: VALID_IDS,
    maxTimezones: MAX,
    handlers,
  });
  return { result, setTimezones: handlers.setTimezones };
}

function action(
  type: CommandAction["type"],
  fields: Partial<Pick<CommandAction, "timezoneId" | "timezoneIds">> = {},
): CommandAction {
  return {
    type,
    timezoneId: fields.timezoneId ?? null,
    timezoneIds: fields.timezoneIds ?? null,
  };
}

describe("executeCommandActions: single actions", () => {
  it("adds a single timezone", () => {
    const { result, setTimezones } = run(
      [action("add_timezone", { timezoneId: "Asia/Tokyo" })],
      ["America/New_York"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["America/New_York", "Asia/Tokyo"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
    expect(result.failures).toEqual([]);
    expect(result.summaries[0]).toMatch(/^Added /);
  });

  it("rejects adding a duplicate timezone without committing state", () => {
    const { result, setTimezones } = run(
      [action("add_timezone", { timezoneId: "Asia/Tokyo" })],
      ["Asia/Tokyo"],
    );

    expect(setTimezones).not.toHaveBeenCalled();
    expect(result.appliedCount).toBe(0);
    expect(result.failures).toEqual(["Asia/Tokyo is already added."]);
  });

  it("removes a single timezone", () => {
    const { result, setTimezones } = run(
      [action("remove_timezone", { timezoneId: "Asia/Tokyo" })],
      ["America/New_York", "Asia/Tokyo"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["America/New_York"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
    expect(result.summaries[0]).toMatch(/^Removed /);
  });

  it("auto-adds when setting home to an undisplayed timezone", () => {
    const { result, setTimezones } = run(
      [action("set_home_timezone", { timezoneId: "Europe/London" })],
      ["America/New_York"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["America/New_York", "Europe/London"],
      "Europe/London",
    );
    expect(result.appliedCount).toBe(1);
  });
});

describe("executeCommandActions: bulk add", () => {
  it("adds every valid timezone and reports one combined summary", () => {
    const { result, setTimezones } = run(
      [
        action("add_timezones", {
          timezoneIds: ["Europe/London", "Europe/Paris", "Europe/Berlin"],
        }),
      ],
      ["America/New_York"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["America/New_York", "Europe/London", "Europe/Paris", "Europe/Berlin"],
      undefined,
    );
    expect(result.appliedCount).toBe(3);
    expect(result.failures).toEqual([]);
    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0]).toMatch(/^Added .+, .+, .+$/);
  });

  it("applies valid IDs and reports unknown or duplicate IDs as failures", () => {
    const { result, setTimezones } = run(
      [
        action("add_timezones", {
          timezoneIds: ["Europe/London", "Fake/Zone", "Asia/Tokyo"],
        }),
      ],
      ["Asia/Tokyo"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["Asia/Tokyo", "Europe/London"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
    expect(result.failures).toEqual([
      "Unknown timezone: Fake/Zone.",
      "Asia/Tokyo is already added.",
    ]);
  });

  it("stops adding at the timezone cap with a failure per overflow ID", () => {
    const active = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
    ];
    const { result, setTimezones } = run(
      [
        action("add_timezones", {
          timezoneIds: ["Asia/Tokyo", "Australia/Sydney"],
        }),
      ],
      active,
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      [...active, "Asia/Tokyo"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
    expect(result.failures).toEqual([`Maximum of ${MAX} timezones reached.`]);
  });
});

describe("executeCommandActions: bulk remove", () => {
  it("removes every listed timezone that is displayed", () => {
    const { result, setTimezones } = run(
      [
        action("remove_timezones", {
          timezoneIds: ["Europe/London", "Europe/Paris"],
        }),
      ],
      ["America/New_York", "Europe/London", "Europe/Paris"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["America/New_York"],
      undefined,
    );
    expect(result.appliedCount).toBe(2);
    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0]).toMatch(/^Removed /);
  });

  it("reports undisplayed timezones as failures while removing the rest", () => {
    const { result, setTimezones } = run(
      [
        action("remove_timezones", {
          timezoneIds: ["Europe/London", "Asia/Tokyo"],
        }),
      ],
      ["America/New_York", "Europe/London"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["America/New_York"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
    expect(result.failures).toEqual(["Asia/Tokyo is not currently shown."]);
  });
});

describe("executeCommandActions: replace_all", () => {
  it("replaces the list with the target order", () => {
    const { result, setTimezones } = run(
      [
        action("replace_all", {
          timezoneIds: ["Asia/Tokyo", "Europe/London", "Australia/Sydney"],
        }),
      ],
      ["America/New_York", "Europe/London"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["Asia/Tokyo", "Europe/London", "Australia/Sydney"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
    expect(result.failures).toEqual([]);
    expect(result.summaries[0]).toMatch(/^Replaced list with /);
  });

  it("dedupes the target list and skips unknown IDs with failures", () => {
    const { result, setTimezones } = run(
      [
        action("replace_all", {
          timezoneIds: ["Asia/Tokyo", "Asia/Tokyo", "Fake/Zone"],
        }),
      ],
      ["America/New_York"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["Asia/Tokyo"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
    expect(result.failures).toEqual(["Unknown timezone: Fake/Zone."]);
  });

  it("fails without touching state when no target ID is valid", () => {
    const { result, setTimezones } = run(
      [action("replace_all", { timezoneIds: ["Fake/Zone", "Also/Fake"] })],
      ["America/New_York"],
    );

    expect(setTimezones).not.toHaveBeenCalled();
    expect(result.appliedCount).toBe(0);
    expect(result.failures).toEqual([
      "Unknown timezone: Fake/Zone.",
      "Unknown timezone: Also/Fake.",
      "No valid timezones to replace the list with.",
    ]);
  });
});

describe("executeCommandActions: reorder and clear", () => {
  it("reorders when given a full permutation of displayed zones", () => {
    const { result, setTimezones } = run(
      [
        action("reorder_timezones", {
          timezoneIds: ["Asia/Tokyo", "America/New_York"],
        }),
      ],
      ["America/New_York", "Asia/Tokyo"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["Asia/Tokyo", "America/New_York"],
      undefined,
    );
    expect(result.appliedCount).toBe(1);
  });

  it("rejects a reorder that omits a displayed timezone", () => {
    const { result, setTimezones } = run(
      [action("reorder_timezones", { timezoneIds: ["Asia/Tokyo"] })],
      ["America/New_York", "Asia/Tokyo"],
    );

    expect(setTimezones).not.toHaveBeenCalled();
    expect(result.appliedCount).toBe(0);
    expect(result.failures).toEqual([
      "Reorder action must include all currently displayed timezones.",
    ]);
  });

  it("clears all displayed timezones", () => {
    const { result, setTimezones } = run(
      [action("clear_all")],
      ["America/New_York", "Asia/Tokyo"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith([], undefined);
    expect(result.appliedCount).toBe(1);
    expect(result.summaries).toEqual(["Cleared all timezones"]);
  });
});

describe("executeCommandActions: sequenced actions", () => {
  it("folds all actions into one final state commit", () => {
    const { result, setTimezones } = run(
      [
        action("remove_timezones", {
          timezoneIds: ["Europe/London", "Europe/Paris"],
        }),
        action("add_timezones", {
          timezoneIds: ["Asia/Tokyo", "Australia/Sydney"],
        }),
        action("set_home_timezone", { timezoneId: "Asia/Tokyo" }),
      ],
      ["America/New_York", "Europe/London", "Europe/Paris"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["America/New_York", "Asia/Tokyo", "Australia/Sydney"],
      "Asia/Tokyo",
    );
    expect(result.appliedCount).toBe(5);
    expect(result.failures).toEqual([]);
    expect(result.summaries).toHaveLength(3);
  });

  it("sees earlier changes from later actions (clear then add)", () => {
    const { result, setTimezones } = run(
      [
        action("clear_all"),
        action("add_timezones", {
          timezoneIds: ["Asia/Tokyo", "Europe/London"],
        }),
      ],
      ["America/New_York", "Europe/Paris"],
    );

    expect(setTimezones).toHaveBeenCalledExactlyOnceWith(
      ["Asia/Tokyo", "Europe/London"],
      undefined,
    );
    expect(result.appliedCount).toBe(3);
    expect(result.failures).toEqual([]);
  });
});
