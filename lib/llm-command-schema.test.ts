import { describe, expect, it } from "vitest";
import {
  commandRequestSchema,
  commandResponseSchema,
  openRouterCommandResponseFormat,
} from "./llm-command-schema";

describe("commandRequestSchema", () => {
  it("accepts valid request payloads", () => {
    const parsed = commandRequestSchema.safeParse({
      query: "remove los angeles",
      currentTimezoneIds: ["America/New_York", "America/Los_Angeles"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty query payloads", () => {
    const parsed = commandRequestSchema.safeParse({
      query: "",
      currentTimezoneIds: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects oversized timezone id entries", () => {
    const parsed = commandRequestSchema.safeParse({
      query: "what time is it",
      currentTimezoneIds: ["x".repeat(65)],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("commandResponseSchema", () => {
  it("accepts mixed action responses", () => {
    const parsed = commandResponseSchema.safeParse({
      answerText: "Removed Los Angeles from your timeline.",
      actions: [
        {
          type: "remove_timezone",
          timezoneId: "America/Los_Angeles",
          timezoneIds: null,
        },
        {
          type: "set_home_timezone",
          timezoneId: "America/New_York",
          timezoneIds: null,
        },
      ],
      errorMessage: null,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unsupported action types", () => {
    const parsed = commandResponseSchema.safeParse({
      answerText: null,
      actions: [{ type: "unknown_action" }],
      errorMessage: "Unsupported action",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects action payloads with missing required ids", () => {
    const parsed = commandResponseSchema.safeParse({
      answerText: null,
      actions: [
        {
          type: "add_timezone",
          timezoneId: null,
          timezoneIds: null,
        },
      ],
      errorMessage: null,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects reorder actions with an empty timezoneIds array", () => {
    const parsed = commandResponseSchema.safeParse({
      answerText: null,
      actions: [
        {
          type: "reorder_timezones",
          timezoneId: null,
          timezoneIds: [],
        },
      ],
      errorMessage: null,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("openRouterCommandResponseFormat", () => {
  it("uses strict JSON schema mode", () => {
    expect(openRouterCommandResponseFormat.type).toBe("json_schema");
    expect(openRouterCommandResponseFormat.json_schema.strict).toBe(true);
  });
});
