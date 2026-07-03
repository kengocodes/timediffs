const ALLOWLIST_PATTERNS: RegExp[] = [
  /\b(times?|timezones?|utc|gmt|offset|dst|hours?|clock)\b/i,
  /\b(convert|conversion|difference|ahead|behind|between|compare|comparison|vs|versus|overlap)\b/i,
  /\b(am|pm|\d{1,2}:\d{2}|\d{1,2}\s?(am|pm))\b/i,
  /\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/i,
  /\b(holiday|public holiday|bank holiday)\b/i,
  /\b(add|remove|delete|clear|set home|reorder|move)\b/i,
];

const DENYLIST_PATTERNS: RegExp[] = [
  /\b(ignore (all|previous) instructions)\b/i,
  /\b(system prompt|developer message|jailbreak)\b/i,
  /\b(reveal|show|print).*(api key|env|environment variable|secret|token)\b/i,
  /\b(write code|typescript|javascript|python|sql|regex)\b/i,
  /\b(hack|exploit|bypass|prompt injection)\b/i,
];

export type CommandQueryPolicy = {
  allowed: boolean;
  reason: "in_scope" | "out_of_scope" | "prompt_injection";
};

export function evaluateCommandQueryPolicy(query: string): CommandQueryPolicy {
  for (const pattern of DENYLIST_PATTERNS) {
    if (pattern.test(query)) {
      return { allowed: false, reason: "prompt_injection" };
    }
  }

  const allowMatchCount = ALLOWLIST_PATTERNS.reduce(
    (count, pattern) => count + (pattern.test(query) ? 1 : 0),
    0
  );

  if (allowMatchCount === 0) {
    return { allowed: false, reason: "out_of_scope" };
  }

  return { allowed: true, reason: "in_scope" };
}
