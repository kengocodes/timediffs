// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { commandRateLimiter } from "@/lib/rate-limit";
import {
  COMMAND_RATE_LIMIT_MAX_REQUESTS,
  COMMAND_REQUEST_MAX_BYTES,
} from "@/lib/command-constraints";

const ENDPOINT = "http://localhost:3000/api/command";

let ipCounter = 0;

/** Unique IP per test so per-client rate limit state never leaks across tests. */
function nextIp(): string {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter % 256}`;
}

function makeRequest(
  body: unknown,
  options: { ip?: string; headers?: Record<string, string> } = {},
): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-real-ip": options.ip ?? nextIp(),
      ...options.headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockOpenRouterSuccess(payload: {
  answerText: string | null;
  actions: unknown[];
  errorMessage: string | null;
}) {
  // A fresh Response per call: a body can only be consumed once.
  return vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(payload) } }],
        }),
        { status: 200 },
      ),
    ),
  );
}

const VALID_BODY = {
  query: "what time is it in Tokyo",
  currentTimezoneIds: ["America/New_York"],
};

describe("POST /api/command", () => {
  beforeEach(() => {
    commandRateLimiter.reset();
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the model response on the happy path", async () => {
    const fetchMock = mockOpenRouterSuccess({
      answerText: "It is 5pm in Tokyo.",
      actions: [],
      errorMessage: null,
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest(VALID_BODY));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.answerText).toBe("It is 5pm in Tokyo.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bounds the LLM call with max_tokens and a timeout signal", async () => {
    const fetchMock = mockOpenRouterSuccess({
      answerText: "ok",
      actions: [],
      errorMessage: null,
    });
    vi.stubGlobal("fetch", fetchMock);

    await POST(makeRequest(VALID_BODY));

    const [, requestInit] = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(requestInit.body);
    expect(requestBody.max_tokens).toBeGreaterThan(0);
    expect(requestInit.signal).toBeInstanceOf(AbortSignal);
  });

  it("drops unknown timezone ids before building the prompt", async () => {
    const fetchMock = mockOpenRouterSuccess({
      answerText: "ok",
      actions: [],
      errorMessage: null,
    });
    vi.stubGlobal("fetch", fetchMock);

    await POST(
      makeRequest({
        query: "what time is it in Tokyo",
        currentTimezoneIds: ["America/New_York", "Fake/Not_A_Zone"],
      }),
    );

    const [, requestInit] = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(requestInit.body);
    const userPayload = JSON.parse(requestBody.messages[1].content);
    expect(userPayload.currentTimezoneIds).toEqual(["America/New_York"]);
    expect(
      userPayload.currentTimezoneSnapshots.map(
        (snapshot: { timezoneId: string }) => snapshot.timezoneId,
      ),
    ).toEqual(["America/New_York"]);
  });

  it("rejects cross-origin requests with 403", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest(VALID_BODY, {
        headers: { origin: "https://evil.example.com" },
      }),
    );

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows same-origin requests", async () => {
    vi.stubGlobal(
      "fetch",
      mockOpenRouterSuccess({ answerText: "ok", actions: [], errorMessage: null }),
    );

    const response = await POST(
      makeRequest(VALID_BODY, {
        headers: { origin: "http://localhost:3000" },
      }),
    );

    expect(response.status).toBe(200);
  });

  it("rejects oversized bodies with 413", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest("x".repeat(COMMAND_REQUEST_MAX_BYTES + 1)),
    );

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON with 400", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const response = await POST(makeRequest("{not json"));

    expect(response.status).toBe(400);
  });

  it("rejects out-of-scope queries with 422 without calling the LLM", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        query: "tell me a story about dragons",
        currentTimezoneIds: [],
      }),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate limits a client after the per-client budget with Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      mockOpenRouterSuccess({ answerText: "ok", actions: [], errorMessage: null }),
    );
    const ip = nextIp();

    for (let i = 0; i < COMMAND_RATE_LIMIT_MAX_REQUESTS; i++) {
      const response = await POST(makeRequest(VALID_BODY, { ip }));
      expect(response.status).toBe(200);
    }

    const limitedResponse = await POST(makeRequest(VALID_BODY, { ip }));
    expect(limitedResponse.status).toBe(429);
    const retryAfter = Number(limitedResponse.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("returns a generic 500 when the API key is missing", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubGlobal("fetch", vi.fn());

    const response = await POST(makeRequest(VALID_BODY));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.errorMessage).not.toMatch(/OPENROUTER_API_KEY/);
  });

  it("returns a generic 502 when the AI provider errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream detail", { status: 401 })),
    );

    const response = await POST(makeRequest(VALID_BODY));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.errorMessage).not.toMatch(/openrouter|401|upstream/i);
  });

  it("returns 504 when the AI provider times out", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          new DOMException("The operation timed out", "TimeoutError"),
        ),
    );

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(504);
  });

  it("does not leak internal error details to the client", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "not-valid-json{{" } }],
          }),
          { status: 200 },
        ),
      ),
    );

    const response = await POST(makeRequest(VALID_BODY));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.errorMessage).not.toMatch(/JSON|unexpected token/i);
  });

  it("returns 502 when the model output fails schema validation", async () => {
    vi.stubGlobal(
      "fetch",
      mockOpenRouterSuccess({
        answerText: null,
        actions: [{ type: "delete_everything", timezoneId: null, timezoneIds: null }],
        errorMessage: null,
      }),
    );

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(502);
  });
});
