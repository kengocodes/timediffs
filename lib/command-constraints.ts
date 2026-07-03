export const COMMAND_QUERY_MAX_CHARS = 80;
export const COMMAND_ANSWER_MAX_CHARS = 280;
export const COMMAND_ERROR_MAX_CHARS = 160;
export const COMMAND_ACTIONS_MAX = 8;

/** Longest real IANA identifiers are ~30 chars; 64 leaves headroom. */
export const COMMAND_TIMEZONE_ID_MAX_CHARS = 64;

export const COMMAND_RATE_LIMIT_WINDOW_MS = 60_000;
export const COMMAND_RATE_LIMIT_MAX_REQUESTS = 12;
/** Cost backstop across all clients on a server instance, per window. */
export const COMMAND_GLOBAL_RATE_LIMIT_MAX_REQUESTS = 60;
/** Bounds the in-memory rate limit store so IP rotation cannot exhaust memory. */
export const COMMAND_RATE_LIMIT_MAX_TRACKED_CLIENTS = 10_000;

/** A valid request payload is well under 1 KB; anything larger is abuse. */
export const COMMAND_REQUEST_MAX_BYTES = 4_096;

export const COMMAND_LLM_TIMEOUT_MS = 15_000;
/** Server timeout plus buffer for network overhead. */
export const COMMAND_CLIENT_TIMEOUT_MS = 20_000;
/** Enough for a 280-char answer plus JSON scaffolding and actions. */
export const COMMAND_LLM_MAX_TOKENS = 350;
