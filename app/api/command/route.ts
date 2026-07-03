import { NextResponse } from "next/server";
import {
  commandRequestSchema,
  commandResponseSchema,
  openRouterCommandResponseFormat,
} from "@/lib/llm-command-schema";
import { COMMAND_QUERY_MAX_CHARS } from "@/lib/command-constraints";
import {
  COMMAND_RATE_LIMIT_MAX_REQUESTS,
  COMMAND_RATE_LIMIT_WINDOW_MS,
} from "@/lib/command-constraints";
import { evaluateCommandQueryPolicy } from "@/lib/command-safety";
import { MAX_TIMEZONES } from "@/lib/timezone-constraints";

export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-5.4-nano";
const ipRateLimitStore = new Map<
  string,
  { count: number; windowStartMs: number }
>();

function buildSystemPrompt(): string {
  return [
    "You are an action planner for a timezone app.",
    "Return strict JSON only using the provided schema.",
    "The user asks in natural language. You can return actions and/or an answer.",
    "Allowed action types: add_timezone, remove_timezone, clear_all, set_home_timezone, reorder_timezones.",
    "Use IANA timezone IDs like America/Los_Angeles and Asia/Manila.",
    "Prefer no action when the user asks a pure question.",
    "For reorder_timezones, include all currently displayed timezone IDs exactly once, in the final desired order.",
    "set_home_timezone works for any timezone; the app adds it to the list automatically if it is not displayed yet.",
    "For time questions, use the provided currentUtcIso timestamp as the authoritative current time.",
    "For city names, infer the canonical timezone ID when it is common and unambiguous (for example Kyoto -> Asia/Tokyo).",
    "Do not refuse normal timezone conversion questions. Answer directly using timezone conversion logic.",
    "If the request is unclear, set errorMessage with a short clarification.",
    "Do not invent unsupported action types.",
  ].join(" ");
}

function getTimezoneSnapshots(timezoneIds: string[], now: Date) {
  return timezoneIds.map((timezoneId) => {
    try {
      const localTime = new Intl.DateTimeFormat("en-US", {
        timeZone: timezoneId,
        dateStyle: "full",
        timeStyle: "long",
      }).format(now);
      return { timezoneId, localTime };
    } catch {
      return { timezoneId, localTime: null };
    }
  });
}

function parseContent(content: unknown): unknown {
  if (typeof content === "string") {
    return JSON.parse(content);
  }

  if (Array.isArray(content)) {
    const textParts = content
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: unknown }).type === "text" &&
          "text" in part
        ) {
          return (part as { text?: unknown }).text;
        }
        return null;
      })
      .filter((value): value is string => typeof value === "string");

    if (textParts.length > 0) {
      return JSON.parse(textParts.join(""));
    }
  }

  throw new Error("Model returned an unexpected content shape");
}

function getRequestValidationMessage(
  issues: { path: PropertyKey[]; code: string }[],
) {
  const queryTooLong = issues.some(
    (issue) =>
      issue.path.length === 1 &&
      typeof issue.path[0] === "string" &&
      issue.path[0] === "query" &&
      issue.code === "too_big",
  );
  if (queryTooLong) {
    return `Please keep messages under ${COMMAND_QUERY_MAX_CHARS} characters.`;
  }
  return "Invalid request payload.";
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }

  return "unknown";
}

function isRateLimited(clientIp: string): boolean {
  const nowMs = Date.now();
  const existing = ipRateLimitStore.get(clientIp);

  if (
    !existing ||
    nowMs - existing.windowStartMs >= COMMAND_RATE_LIMIT_WINDOW_MS
  ) {
    ipRateLimitStore.set(clientIp, { count: 1, windowStartMs: nowMs });
    return false;
  }

  if (existing.count >= COMMAND_RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  ipRateLimitStore.set(clientIp, existing);
  return false;
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          answerText: null,
          actions: [],
          errorMessage:
            "Rate limit exceeded. Please wait before sending another request.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsedRequest = commandRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json(
        {
          answerText: null,
          actions: [],
          errorMessage: getRequestValidationMessage(parsedRequest.error.issues),
        },
        { status: 400 },
      );
    }

    const queryPolicy = evaluateCommandQueryPolicy(parsedRequest.data.query);
    if (!queryPolicy.allowed) {
      return NextResponse.json({
        answerText: null,
        actions: [],
        errorMessage:
          queryPolicy.reason === "prompt_injection"
            ? "I can only help with timezone, date, and holiday questions here."
            : "This input is out of scope. Please ask a date, time, timezone, or holiday question.",
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          answerText: null,
          actions: [],
          errorMessage: "Server is missing OPENROUTER_API_KEY.",
        },
        { status: 500 },
      );
    }

    const now = new Date();
    const userPayload = {
      query: parsedRequest.data.query,
      currentTimezoneIds: parsedRequest.data.currentTimezoneIds,
      currentUtcIso: now.toISOString(),
      currentTimezoneSnapshots: getTimezoneSnapshots(
        parsedRequest.data.currentTimezoneIds,
        now,
      ),
      maxTimezones: MAX_TIMEZONES,
    };

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
        response_format: openRouterCommandResponseFormat,
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter request failed", {
        status: response.status,
        body: await response.text(),
      });
      return NextResponse.json(
        {
          answerText: null,
          actions: [],
          errorMessage: `OpenRouter request failed (${response.status}).`,
        },
        { status: 502 },
      );
    }

    const completion = await response.json();
    const content = completion?.choices?.[0]?.message?.content;
    const parsedContent = parseContent(content);
    const parsedResponse = commandResponseSchema.safeParse(parsedContent);

    if (!parsedResponse.success) {
      return NextResponse.json(
        {
          answerText: null,
          actions: [],
          errorMessage: "Model response failed schema validation.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(parsedResponse.data);
  } catch (error) {
    return NextResponse.json(
      {
        answerText: null,
        actions: [],
        errorMessage:
          error instanceof Error
            ? error.message
            : "Unexpected server error while handling command.",
      },
      { status: 500 },
    );
  }
}
