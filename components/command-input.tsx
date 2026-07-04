"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUp, Loader2, X } from "lucide-react";
import { useTimezone } from "@/contexts/timezone-context";
import type { CommandResponse } from "@/lib/llm-command-schema";
import { executeCommandActions } from "@/lib/command-actions";
import {
  COMMAND_CLIENT_TIMEOUT_MS,
  COMMAND_QUERY_MAX_CHARS,
} from "@/lib/command-constraints";
import { getAllTimezoneIds } from "@/lib/timezone";
import { MAX_TIMEZONES } from "@/lib/url-parsers";
import { cn } from "@/lib/utils";
import { AiResponseMarkdown } from "@/components/ai-response-markdown";

interface CommandInputProps {
  className?: string;
}

// Desktop placeholder examples (constant, defined outside component)
const DESKTOP_PLACEHOLDER_EXAMPLES = [
  'Try "New York timezone" or "Compare Tokyo with London"',
  'Ask "What\'s the time in Paris?" or "Sydney vs Dubai"',
  'Type "Add Tokyo, Sydney and Berlin" or "Remove the European zones"',
  'Enter "Sort by offset" or "Replace everything with US timezones"',
] as const;

// Mobile placeholder examples kept short for narrow screens
const MOBILE_PLACEHOLDER_EXAMPLES = [
  "Ask in natural language",
  "e.g. what time to call my mom in Manila?",
  "e.g. add Tokyo, Sydney and Berlin",
  "e.g. compare Tokyo and New York",
] as const;

// Show the character counter once the user is close to the limit.
const CHAR_COUNTER_THRESHOLD = COMMAND_QUERY_MAX_CHARS - 20;
const ACTION_SUMMARY_DISMISS_MS = 5000;
const DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS = 30;

type AbortKind = "user" | "timeout" | "unmount";

export function CommandInput({ className }: CommandInputProps) {
  const { setTimezones, timezoneDisplays } = useTimezone();
  const [input, setInput] = useState("");
  const placeholderIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string | null>(null);
  const [actionSummary, setActionSummary] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const abortKindRef = useRef<AbortKind | null>(null);
  const summaryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const wasProcessingRef = useRef(false);
  const validTimezoneIds = useMemo(() => new Set(getAllTimezoneIds()), []);
  // Unique per instance: desktop and mobile inputs can be mounted at once.
  const messageIdPrefix = useId();
  const errorTextId = `${messageIdPrefix}-command-error`;
  const helperTextId = `${messageIdPrefix}-command-helper`;

  const isMobile = className?.includes("mobile-command-input");
  const placeholderExamples = isMobile
    ? MOBILE_PLACEHOLDER_EXAMPLES
    : DESKTOP_PLACEHOLDER_EXAMPLES;

  // Rotate placeholder only when input is empty
  useEffect(() => {
    if (placeholderIntervalRef.current) {
      clearInterval(placeholderIntervalRef.current);
    }

    if (!input.trim()) {
      placeholderIntervalRef.current = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
      }, 5000);
    }

    return () => {
      if (placeholderIntervalRef.current) {
        clearInterval(placeholderIntervalRef.current);
      }
    };
  }, [input, placeholderExamples]);

  // Cleanup timers and in-flight request on unmount
  useEffect(() => {
    return () => {
      if (placeholderIntervalRef.current) {
        clearInterval(placeholderIntervalRef.current);
      }
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
      abortKindRef.current = "unmount";
      abortControllerRef.current?.abort();
    };
  }, []);

  // Countdown for the rate limit cooldown shown after a 429 response
  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [cooldownSeconds]);

  // Restore focus after a request finishes (the input is disabled in flight,
  // which drops focus).
  useEffect(() => {
    if (wasProcessingRef.current && !isProcessing) {
      inputRef.current?.focus();
    }
    wasProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const showActionSummary = (summaries: string[]) => {
    if (summaries.length === 0) {
      return;
    }
    setActionSummary(summaries.join(" · "));
    if (summaryTimeoutRef.current) {
      clearTimeout(summaryTimeoutRef.current);
    }
    summaryTimeoutRef.current = setTimeout(() => {
      setActionSummary(null);
    }, ACTION_SUMMARY_DISMISS_MS);
  };

  const dismissResponseCard = () => {
    setAnswerText(null);
    setActionSummary(null);
  };

  const executeCommand = async () => {
    if (!input.trim() || isProcessing || cooldownSeconds > 0) {
      return;
    }
    if (input.length > COMMAND_QUERY_MAX_CHARS) {
      setError(
        `Please keep messages under ${COMMAND_QUERY_MAX_CHARS} characters.`,
      );
      return;
    }

    setIsProcessing(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    abortKindRef.current = null;
    const timeoutId = setTimeout(() => {
      abortKindRef.current = "timeout";
      controller.abort();
    }, COMMAND_CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch("/api/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input.trim(),
          currentTimezoneIds: timezoneDisplays.map(
            (display) => display.timezone.id,
          ),
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        const retryAfterSeconds = Number.parseInt(
          response.headers.get("Retry-After") ?? "",
          10,
        );
        setAnswerText(null);
        setError(null);
        setCooldownSeconds(
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? retryAfterSeconds
            : DEFAULT_RATE_LIMIT_COOLDOWN_SECONDS,
        );
        return;
      }

      const payload = (await response.json()) as CommandResponse;

      if (!response.ok) {
        // Clear any previous answer so it can't be mistaken for a response
        // to the failed command.
        setAnswerText(null);
        setError(payload.errorMessage || "Command failed.");
        return;
      }

      const actionResult = executeCommandActions({
        actions: payload.actions,
        activeTimezoneIds: timezoneDisplays.map(
          (display) => display.timezone.id,
        ),
        validTimezoneIds,
        maxTimezones: MAX_TIMEZONES,
        handlers: { setTimezones },
      });
      setAnswerText(payload.answerText);
      showActionSummary(actionResult.summaries);
      if (actionResult.appliedCount > 0 || payload.answerText) {
        setInput("");
      }

      const combinedFailures = [
        ...(payload.errorMessage ? [payload.errorMessage] : []),
        ...actionResult.failures,
      ];
      if (combinedFailures.length > 0) {
        setError(combinedFailures.join(" "));
      }
    } catch (requestError) {
      const abortKind = abortKindRef.current;
      if (abortKind === "unmount") {
        return;
      }
      if (abortKind === "user") {
        // The user canceled; keep their text and stay quiet.
        return;
      }
      if (abortKind === "timeout") {
        setError("The request took too long. Please try again.");
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unexpected error while sending command.",
      );
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsProcessing(false);
    }
  };

  const cancelCommand = () => {
    abortKindRef.current = "user";
    abortControllerRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void executeCommand();
      return;
    }
    if (e.key === "Escape" && (answerText || actionSummary)) {
      e.preventDefault();
      dismissResponseCard();
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isProcessing) {
      cancelCommand();
      return;
    }
    void executeCommand();
  };

  const cooldownMessage =
    cooldownSeconds > 0
      ? `Rate limit reached. Try again in ${cooldownSeconds}s.`
      : null;
  const displayedError = cooldownMessage ?? error;
  const showCharCounter = input.length >= CHAR_COUNTER_THRESHOLD;
  const charCounter = showCharCounter ? (
    <p
      className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-stone-500"
      aria-label={`${input.length} of ${COMMAND_QUERY_MAX_CHARS} characters used`}
    >
      {input.length}/{COMMAND_QUERY_MAX_CHARS}
    </p>
  ) : null;

  return (
    <div className={cn("relative w-full", className)}>
      <div aria-live="polite">
        {(answerText || actionSummary) && (
          <div className="mb-3 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-slate-700 dark:text-stone-300">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {answerText && (
                  <AiResponseMarkdown
                    content={answerText}
                    className="text-slate-700 dark:text-stone-300"
                  />
                )}
                {actionSummary && (
                  <p
                    className={cn(
                      "text-xs text-slate-500 dark:text-stone-400",
                      answerText && "mt-1.5",
                    )}
                  >
                    {actionSummary}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={dismissResponseCard}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors"
                aria-label="Dismiss AI response"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          className={cn(
            "relative flex items-center border bg-white dark:bg-stone-900 shadow-sm transition-all duration-200",
            "hover:shadow-md focus-within:shadow-md",
            displayedError
              ? "border-red-300 dark:border-red-800 focus-within:border-red-400 dark:focus-within:border-red-700"
              : "border-slate-200 dark:border-stone-700 focus-within:border-slate-300 dark:focus-within:border-stone-600",
            isMobile ? "rounded-xl min-h-12 gap-1 p-1 pl-3" : "rounded-2xl",
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              const nextValue = e.target.value;
              const isOverLimit = nextValue.length > COMMAND_QUERY_MAX_CHARS;
              const value = nextValue.slice(0, COMMAND_QUERY_MAX_CHARS);
              setInput(value);
              if (isOverLimit) {
                setError(
                  `Please keep messages under ${COMMAND_QUERY_MAX_CHARS} characters.`,
                );
              } else if (error) {
                setError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholderExamples[placeholderIndex]}
            className={cn(
              "flex-1 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-stone-500",
              "text-slate-900 dark:text-stone-100 font-normal caret-slate-900 dark:caret-stone-100",
              "focus:caret-slate-900 dark:focus:caret-stone-100",
              isMobile
                ? "min-h-10 flex-1 px-0 text-base touch-manipulation"
                : cn("px-4 py-3 text-sm", isProcessing ? "pr-20" : "pr-12"),
            )}
            aria-label="Command input for timezone queries"
            aria-describedby={displayedError ? errorTextId : helperTextId}
            disabled={isProcessing}
          />
          {isProcessing && (
            <Loader2
              className={cn(
                "h-4 w-4 shrink-0 animate-spin text-slate-400 dark:text-stone-500",
                !isMobile && "absolute right-12",
              )}
              aria-hidden="true"
            />
          )}
          <button
            onClick={handleButtonClick}
            disabled={!isProcessing && (!input.trim() || cooldownSeconds > 0)}
            className={cn(
              "transition-all duration-200",
              !isMobile && "absolute",
              "bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900",
              "hover:bg-slate-800 dark:hover:bg-stone-200",
              "disabled:bg-slate-200 dark:disabled:bg-stone-700 disabled:text-slate-400 dark:disabled:text-stone-500",
              "focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-stone-500 focus:ring-offset-2",
              isMobile
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg touch-manipulation no-tap-highlight"
                : "right-2 p-2 rounded-lg",
            )}
            aria-label={isProcessing ? "Cancel request" : "Execute command"}
          >
            {isProcessing ? (
              <X className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {!isMobile && (
        <div
          className="mt-2 px-1 min-h-[20px] flex items-start justify-between gap-2"
          aria-live="polite"
        >
          {displayedError ? (
            <p
              id={errorTextId}
              className="text-xs text-red-600 dark:text-red-400"
            >
              {displayedError}
            </p>
          ) : (
            <p
              id={helperTextId}
              className="text-xs text-slate-500 dark:text-stone-400"
            >
              Ask in natural language • Powered by OpenRouter.
            </p>
          )}
          {charCounter}
        </div>
      )}

      {isMobile && (displayedError || showCharCounter) && (
        <div
          className="mt-2 px-1 min-h-[20px] flex items-start justify-between gap-2"
          aria-live="polite"
        >
          {displayedError && (
            <p
              id={errorTextId}
              className="text-xs text-red-600 dark:text-red-400"
            >
              {displayedError}
            </p>
          )}
          {charCounter}
        </div>
      )}
    </div>
  );
}
