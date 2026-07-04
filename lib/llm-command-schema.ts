import { z } from "zod";
import {
  COMMAND_ACTIONS_MAX,
  COMMAND_ANSWER_MAX_CHARS,
  COMMAND_ERROR_MAX_CHARS,
  COMMAND_QUERY_MAX_CHARS,
  COMMAND_TIMEZONE_ID_MAX_CHARS,
} from "@/lib/command-constraints";
import { MAX_TIMEZONES } from "@/lib/timezone-constraints";

export const COMMAND_ACTION_TYPES = [
  "add_timezone",
  "add_timezones",
  "remove_timezone",
  "remove_timezones",
  "replace_all",
  "clear_all",
  "set_home_timezone",
  "reorder_timezones",
] as const;

export type CommandActionType = (typeof COMMAND_ACTION_TYPES)[number];

/** Action types that operate on a single timezoneId. */
const SINGLE_ID_ACTION_TYPES: ReadonlySet<CommandActionType> = new Set([
  "add_timezone",
  "remove_timezone",
  "set_home_timezone",
]);

/** Action types that operate on a timezoneIds array. */
const MULTI_ID_ACTION_TYPES: ReadonlySet<CommandActionType> = new Set([
  "add_timezones",
  "remove_timezones",
  "replace_all",
  "reorder_timezones",
]);

export const commandActionSchema = z
  .object({
    type: z.enum(COMMAND_ACTION_TYPES),
    timezoneId: z
      .string()
      .min(1)
      .max(COMMAND_TIMEZONE_ID_MAX_CHARS)
      .nullable(),
    timezoneIds: z
      .array(z.string().min(1).max(COMMAND_TIMEZONE_ID_MAX_CHARS))
      .max(MAX_TIMEZONES)
      .nullable(),
  })
  .superRefine((value, ctx) => {
    if (SINGLE_ID_ACTION_TYPES.has(value.type) && !value.timezoneId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "timezoneId is required for this action type",
      });
    }

    if (
      MULTI_ID_ACTION_TYPES.has(value.type) &&
      (!value.timezoneIds || value.timezoneIds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "timezoneIds is required for this action type",
      });
    }
  });

export const commandResponseSchema = z.object({
  answerText: z.string().max(COMMAND_ANSWER_MAX_CHARS).nullable(),
  actions: z.array(commandActionSchema).max(COMMAND_ACTIONS_MAX),
  errorMessage: z.string().max(COMMAND_ERROR_MAX_CHARS).nullable(),
});

export const commandRequestSchema = z.object({
  query: z.string().min(1).max(COMMAND_QUERY_MAX_CHARS),
  currentTimezoneIds: z
    .array(z.string().min(1).max(COMMAND_TIMEZONE_ID_MAX_CHARS))
    .max(MAX_TIMEZONES),
});

export type CommandAction = z.infer<typeof commandActionSchema>;
export type CommandResponse = z.infer<typeof commandResponseSchema>;
export type CommandRequest = z.infer<typeof commandRequestSchema>;

export const openRouterCommandResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "timezone_command_response",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        answerText: {
          type: ["string", "null"],
          maxLength: COMMAND_ANSWER_MAX_CHARS,
        },
        actions: {
          type: "array",
          maxItems: COMMAND_ACTIONS_MAX,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: {
                type: "string",
                enum: [...COMMAND_ACTION_TYPES],
              },
              timezoneId: {
                type: ["string", "null"],
              },
              timezoneIds: {
                type: ["array", "null"],
                maxItems: MAX_TIMEZONES,
                items: { type: "string" },
              },
            },
            required: ["type", "timezoneId", "timezoneIds"],
          },
        },
        errorMessage: {
          type: ["string", "null"],
          maxLength: COMMAND_ERROR_MAX_CHARS,
        },
      },
      required: ["answerText", "actions", "errorMessage"],
    },
  },
} as const;
