import { describe, expect, it } from "vitest";
import { RateLimiter, getClientIpFromHeaders } from "./rate-limit";

function createLimiter(overrides?: {
  maxRequestsPerClient?: number;
  maxRequestsGlobal?: number;
  maxTrackedClients?: number;
}) {
  return new RateLimiter({
    windowMs: 60_000,
    maxRequestsPerClient: overrides?.maxRequestsPerClient ?? 3,
    maxRequestsGlobal: overrides?.maxRequestsGlobal ?? 100,
    maxTrackedClients: overrides?.maxTrackedClients ?? 100,
  });
}

describe("RateLimiter", () => {
  it("allows requests up to the per-client limit, then limits", () => {
    const limiter = createLimiter();
    const nowMs = 1_000_000;

    expect(limiter.check("1.1.1.1", nowMs)).toEqual({ limited: false });
    expect(limiter.check("1.1.1.1", nowMs + 1)).toEqual({ limited: false });
    expect(limiter.check("1.1.1.1", nowMs + 2)).toEqual({ limited: false });

    const decision = limiter.check("1.1.1.1", nowMs + 3);
    expect(decision.limited).toBe(true);
    if (decision.limited) {
      expect(decision.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      expect(decision.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
  });

  it("tracks clients independently", () => {
    const limiter = createLimiter({ maxRequestsPerClient: 1 });
    const nowMs = 1_000_000;

    expect(limiter.check("1.1.1.1", nowMs).limited).toBe(false);
    expect(limiter.check("1.1.1.1", nowMs + 1).limited).toBe(true);
    expect(limiter.check("2.2.2.2", nowMs + 2).limited).toBe(false);
  });

  it("resets the per-client window after windowMs elapses", () => {
    const limiter = createLimiter({ maxRequestsPerClient: 1 });
    const nowMs = 1_000_000;

    expect(limiter.check("1.1.1.1", nowMs).limited).toBe(false);
    expect(limiter.check("1.1.1.1", nowMs + 1).limited).toBe(true);
    expect(limiter.check("1.1.1.1", nowMs + 60_000).limited).toBe(false);
  });

  it("enforces the global budget across distinct clients", () => {
    const limiter = createLimiter({
      maxRequestsPerClient: 100,
      maxRequestsGlobal: 5,
    });
    const nowMs = 1_000_000;

    for (let i = 0; i < 5; i++) {
      expect(limiter.check(`client-${i}`, nowMs + i).limited).toBe(false);
    }

    const decision = limiter.check("client-new", nowMs + 10);
    expect(decision.limited).toBe(true);
  });

  it("resets the global window after windowMs elapses", () => {
    const limiter = createLimiter({
      maxRequestsPerClient: 100,
      maxRequestsGlobal: 1,
    });
    const nowMs = 1_000_000;

    expect(limiter.check("a", nowMs).limited).toBe(false);
    expect(limiter.check("b", nowMs + 1).limited).toBe(true);
    expect(limiter.check("b", nowMs + 60_000).limited).toBe(false);
  });

  it("caps tracked clients by evicting the least recently active", () => {
    const limiter = createLimiter({ maxTrackedClients: 3 });
    const nowMs = 1_000_000;

    limiter.check("a", nowMs);
    limiter.check("b", nowMs + 1);
    limiter.check("c", nowMs + 2);
    limiter.check("d", nowMs + 3);

    expect(limiter.trackedClientCount).toBeLessThanOrEqual(3);
  });

  it("prefers evicting expired entries over live ones", () => {
    const limiter = createLimiter({
      maxRequestsPerClient: 1,
      maxTrackedClients: 2,
    });
    const nowMs = 1_000_000;

    limiter.check("expired", nowMs);
    limiter.check("live", nowMs + 59_000);
    // "expired" window has lapsed by now; the new client should push it out.
    limiter.check("fresh", nowMs + 61_000);

    // "live" was kept, so a second request within its window is limited.
    expect(limiter.check("live", nowMs + 61_500).limited).toBe(true);
  });

  it("resets all state via reset()", () => {
    const limiter = createLimiter({ maxRequestsPerClient: 1 });
    const nowMs = 1_000_000;

    limiter.check("1.1.1.1", nowMs);
    expect(limiter.check("1.1.1.1", nowMs + 1).limited).toBe(true);

    limiter.reset();
    expect(limiter.check("1.1.1.1", nowMs + 2).limited).toBe(false);
    expect(limiter.trackedClientCount).toBe(1);
  });
});

describe("getClientIpFromHeaders", () => {
  it("prefers platform-set headers over x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "6.6.6.6, 7.7.7.7",
      "x-real-ip": "1.2.3.4",
    });
    expect(getClientIpFromHeaders(headers)).toBe("1.2.3.4");
  });

  it("falls back to cf-connecting-ip, then x-forwarded-for", () => {
    expect(
      getClientIpFromHeaders(new Headers({ "cf-connecting-ip": "5.5.5.5" })),
    ).toBe("5.5.5.5");
    expect(
      getClientIpFromHeaders(
        new Headers({ "x-forwarded-for": "6.6.6.6, 7.7.7.7" }),
      ),
    ).toBe("6.6.6.6");
  });

  it("returns 'unknown' when no headers are present", () => {
    expect(getClientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
