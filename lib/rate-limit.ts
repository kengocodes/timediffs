import {
  COMMAND_GLOBAL_RATE_LIMIT_MAX_REQUESTS,
  COMMAND_RATE_LIMIT_MAX_REQUESTS,
  COMMAND_RATE_LIMIT_MAX_TRACKED_CLIENTS,
  COMMAND_RATE_LIMIT_WINDOW_MS,
} from "@/lib/command-constraints";

interface WindowEntry {
  count: number;
  windowStartMs: number;
}

export type RateLimitDecision =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

export interface RateLimiterOptions {
  windowMs: number;
  maxRequestsPerClient: number;
  /** Backstop across all clients, defeating per-client bypass via IP rotation. */
  maxRequestsGlobal: number;
  /** Bounds the client map so an attacker rotating IPs cannot exhaust memory. */
  maxTrackedClients: number;
}

/**
 * Fixed-window rate limiter kept entirely in process memory (no external
 * store). Combines a per-client window with a global per-instance budget.
 */
export class RateLimiter {
  private readonly clients = new Map<string, WindowEntry>();
  private globalWindow: WindowEntry = { count: 0, windowStartMs: 0 };

  constructor(private readonly options: RateLimiterOptions) {}

  check(clientId: string, nowMs: number = Date.now()): RateLimitDecision {
    let clientEntry = this.clients.get(clientId);
    if (clientEntry && this.isExpired(clientEntry, nowMs)) {
      this.clients.delete(clientId);
      clientEntry = undefined;
    }
    if (clientEntry && clientEntry.count >= this.options.maxRequestsPerClient) {
      return {
        limited: true,
        retryAfterSeconds: this.retryAfterSeconds(clientEntry, nowMs),
      };
    }

    if (this.isExpired(this.globalWindow, nowMs)) {
      this.globalWindow = { count: 0, windowStartMs: nowMs };
    }
    if (this.globalWindow.count >= this.options.maxRequestsGlobal) {
      return {
        limited: true,
        retryAfterSeconds: this.retryAfterSeconds(this.globalWindow, nowMs),
      };
    }

    if (clientEntry) {
      clientEntry.count += 1;
      // Re-insert so Map iteration order tracks recency for eviction.
      this.clients.delete(clientId);
      this.clients.set(clientId, clientEntry);
    } else {
      this.evictIfFull(nowMs);
      this.clients.set(clientId, { count: 1, windowStartMs: nowMs });
    }
    this.globalWindow.count += 1;
    return { limited: false };
  }

  private isExpired(entry: WindowEntry, nowMs: number): boolean {
    return nowMs - entry.windowStartMs >= this.options.windowMs;
  }

  private retryAfterSeconds(entry: WindowEntry, nowMs: number): number {
    const msRemaining = entry.windowStartMs + this.options.windowMs - nowMs;
    return Math.max(1, Math.ceil(msRemaining / 1000));
  }

  private evictIfFull(nowMs: number): void {
    if (this.clients.size < this.options.maxTrackedClients) {
      return;
    }

    for (const [clientId, entry] of this.clients) {
      if (this.isExpired(entry, nowMs)) {
        this.clients.delete(clientId);
      }
    }

    // Map iteration order is insertion order, so the first keys are the
    // least recently active clients.
    while (this.clients.size >= this.options.maxTrackedClients) {
      const oldestClientId = this.clients.keys().next().value;
      if (oldestClientId === undefined) {
        break;
      }
      this.clients.delete(oldestClientId);
    }
  }
}

/**
 * Resolves the client IP, preferring headers set by the hosting platform
 * (Vercel sets x-real-ip, Cloudflare sets cf-connecting-ip) over
 * x-forwarded-for, whose first entry can be spoofed by the client.
 */
export function getClientIpFromHeaders(headers: Headers): string {
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return "unknown";
}

export const commandRateLimiter = new RateLimiter({
  windowMs: COMMAND_RATE_LIMIT_WINDOW_MS,
  maxRequestsPerClient: COMMAND_RATE_LIMIT_MAX_REQUESTS,
  maxRequestsGlobal: COMMAND_GLOBAL_RATE_LIMIT_MAX_REQUESTS,
  maxTrackedClients: COMMAND_RATE_LIMIT_MAX_TRACKED_CLIENTS,
});
