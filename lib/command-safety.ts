import { getCityToTimezoneMap } from "@/lib/timezone-data";

const ALLOWLIST_PATTERNS: RegExp[] = [
  /\b(times?|timezones?|utc|gmt|offset|dst|hours?|clock)\b/i,
  /\b(convert|conversion|difference|ahead|behind|between|compare|comparison|vs|versus|overlap)\b/i,
  /\b(am|pm|\d{1,2}:\d{2}|\d{1,2}\s?(am|pm))\b/i,
  /\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/i,
  /\b(holiday|public holiday|bank holiday)\b/i,
  /\b(add|remove|delete|clear|set home|reorder|move)\b/i,
  // Bulk list management verbs (sorting, replacing, keep-only)
  /\b(sort|arrange|reverse|swap|replace|keep)\b/i,
  // Regions used in bulk requests like "add a bunch of European time zones"
  /\b(europe(an)?|asian?|african?|american?|australian?|pacific|atlantic|middle east|scandinavian?|nordic)\b/i,
];

const DENYLIST_PATTERNS: RegExp[] = [
  /\b(ignore (all|previous) instructions)\b/i,
  /\b(system prompt|developer message|jailbreak)\b/i,
  /\b(reveal|show|print).*(api key|env|environment variable|secret|token)\b/i,
  /\b(write code|typescript|javascript|python|sql|regex)\b/i,
  /\b(hack|exploit|bypass|prompt injection)\b/i,
];

// Zero-width characters, bidi controls, and word joiners that attackers use
// to split words and slip past pattern matching.
const INVISIBLE_CHARS_PATTERN = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;
const CONTROL_CHARS_PATTERN = /\p{Cc}/gu;

/**
 * Normalizes a query before policy evaluation (and before it is sent to the
 * LLM): NFKC folds unicode lookalikes (fullwidth letters, ligatures) to
 * ASCII, invisible characters are stripped, and whitespace is collapsed.
 */
export function normalizeCommandQuery(query: string): string {
  return query
    .normalize("NFKC")
    .replace(INVISIBLE_CHARS_PATTERN, "")
    .replace(CONTROL_CHARS_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_PLACE_PHRASE_TOKENS = 3;

/**
 * True when the query mentions a known city, country, or timezone alias
 * (from @vvo/tzdb), so bare place queries like "Paris" count as in-scope
 * without loosening the keyword allowlist.
 */
function queryMentionsKnownPlace(query: string): boolean {
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const placeMap = getCityToTimezoneMap();

  for (let start = 0; start < tokens.length; start++) {
    let phrase = "";
    const end = Math.min(start + MAX_PLACE_PHRASE_TOKENS, tokens.length);
    for (let index = start; index < end; index++) {
      phrase = phrase ? `${phrase} ${tokens[index]}` : tokens[index];
      if (placeMap.has(phrase)) {
        return true;
      }
    }
  }
  return false;
}

export type CommandQueryPolicy = {
  allowed: boolean;
  reason: "in_scope" | "out_of_scope" | "prompt_injection";
};

export function evaluateCommandQueryPolicy(query: string): CommandQueryPolicy {
  const normalizedQuery = normalizeCommandQuery(query);

  for (const pattern of DENYLIST_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return { allowed: false, reason: "prompt_injection" };
    }
  }

  const matchesAllowlist = ALLOWLIST_PATTERNS.some((pattern) =>
    pattern.test(normalizedQuery),
  );

  if (!matchesAllowlist && !queryMentionsKnownPlace(normalizedQuery)) {
    return { allowed: false, reason: "out_of_scope" };
  }

  return { allowed: true, reason: "in_scope" };
}
