"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Loader2, X } from "lucide-react";
import { useTimezone } from "@/contexts/timezone-context";
import type { CommandAction, CommandResponse } from "@/lib/llm-command-schema";
import { COMMAND_QUERY_MAX_CHARS } from "@/lib/command-constraints";
import { getAllTimezoneIds } from "@/lib/timezone";
import { MAX_TIMEZONES } from "@/lib/url-parsers";
import { cn } from "@/lib/utils";

interface CommandInputProps {
  className?: string;
}

// Placeholder examples (constant, defined outside component)
const PLACEHOLDER_EXAMPLES = [
  "Try \"New York timezone\" or \"Compare Tokyo with London\"",
  "Ask \"What's the time in Paris?\" or \"Sydney vs Dubai\"",
  "Type \"Add Singapore\" or \"London and Berlin timezones\"",
  "Enter \"Show Los Angeles time\" or \"India vs California\"",
] as const;

export function CommandInput({ className }: CommandInputProps) {
  const {
    addTimezone,
    removeTimezone,
    reorderTimezones,
    setHomeTimezone,
    timezoneDisplays,
  } = useTimezone();
  const [input, setInput] = useState("");
  const placeholderIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string | null>(null);
  const validTimezoneIds = useMemo(() => new Set(getAllTimezoneIds()), []);

  // Rotate placeholder only when input is empty
  useEffect(() => {
    if (placeholderIntervalRef.current) {
      clearInterval(placeholderIntervalRef.current);
    }

    if (!input.trim()) {
      placeholderIntervalRef.current = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
      }, 5000);
    }

    return () => {
      if (placeholderIntervalRef.current) {
        clearInterval(placeholderIntervalRef.current);
      }
    };
  }, [input]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (placeholderIntervalRef.current) {
        clearInterval(placeholderIntervalRef.current);
      }
    };
  }, []);

  const isMobile = className?.includes("mobile-command-input");

  const normalizeTimezoneId = (value: string | null): string | null => {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    // Strip common trailing/leading punctuation when the model leaks JSON tokens.
    const cleaned = trimmed.replace(/^[^A-Za-z0-9_+\-/]+|[^A-Za-z0-9_+\-/]+$/g, "");
    return cleaned || null;
  };

  const executeActions = (actions: CommandAction[]) => {
    const activeTimezoneIds = new Set(
      timezoneDisplays.map((display) => display.timezone.id)
    );
    const failures: string[] = [];
    let appliedCount = 0;

    for (const action of actions) {
      if (action.type === "add_timezone") {
        const timezoneId = normalizeTimezoneId(action.timezoneId);
        if (!timezoneId) {
          failures.push("Missing timezone ID for add action.");
          continue;
        }
        if (!validTimezoneIds.has(timezoneId)) {
          failures.push(`Unknown timezone: ${action.timezoneId}.`);
          continue;
        }
        if (activeTimezoneIds.has(timezoneId)) {
          failures.push(`${timezoneId} is already added.`);
          continue;
        }
        if (activeTimezoneIds.size >= MAX_TIMEZONES) {
          failures.push(`Maximum of ${MAX_TIMEZONES} timezones reached.`);
          continue;
        }
        addTimezone(timezoneId);
        activeTimezoneIds.add(timezoneId);
        appliedCount += 1;
        continue;
      }

      if (action.type === "remove_timezone") {
        const timezoneId = normalizeTimezoneId(action.timezoneId);
        if (!timezoneId) {
          failures.push("Missing timezone ID for remove action.");
          continue;
        }
        if (!activeTimezoneIds.has(timezoneId)) {
          failures.push(`${timezoneId} is not currently shown.`);
          continue;
        }
        removeTimezone(timezoneId);
        activeTimezoneIds.delete(timezoneId);
        appliedCount += 1;
        continue;
      }

      if (action.type === "clear_all") {
        if (activeTimezoneIds.size === 0) {
          failures.push("Nothing to clear.");
          continue;
        }
        for (const timezoneId of activeTimezoneIds) {
          removeTimezone(timezoneId);
        }
        activeTimezoneIds.clear();
        appliedCount += 1;
        continue;
      }

      if (action.type === "set_home_timezone") {
        const timezoneId = normalizeTimezoneId(action.timezoneId);
        if (!timezoneId) {
          failures.push("Missing timezone ID for home timezone action.");
          continue;
        }
        if (!activeTimezoneIds.has(timezoneId)) {
          failures.push(
            `Cannot set home timezone. ${timezoneId} is not in the list.`
          );
          continue;
        }
        setHomeTimezone(timezoneId);
        appliedCount += 1;
        continue;
      }

      if (action.type === "reorder_timezones") {
        if (!action.timezoneIds) {
          failures.push("Missing timezone IDs for reorder action.");
          continue;
        }
        const normalizedIds = action.timezoneIds
          .map((timezoneId) => normalizeTimezoneId(timezoneId))
          .filter((timezoneId): timezoneId is string => Boolean(timezoneId));

        if (normalizedIds.length !== activeTimezoneIds.size) {
          failures.push(
            "Reorder action must include all currently displayed timezones."
          );
          continue;
        }
        const hasUnknownTimezone = normalizedIds.some(
          (timezoneId) => !activeTimezoneIds.has(timezoneId)
        );
        if (hasUnknownTimezone) {
          failures.push(
            "Reorder action included a timezone not currently displayed."
          );
          continue;
        }
        reorderTimezones(normalizedIds);
        appliedCount += 1;
      }
    }

    return { appliedCount, failures };
  };

  const executeCommand = async () => {
    if (!input.trim() || isProcessing) {
      return;
    }
    if (input.length > COMMAND_QUERY_MAX_CHARS) {
      setError(
        `Please keep messages under ${COMMAND_QUERY_MAX_CHARS} characters.`
      );
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input.trim(),
          currentTimezoneIds: timezoneDisplays.map((display) => display.timezone.id),
        }),
      });

      const payload = (await response.json()) as CommandResponse;

      if (!response.ok) {
        setError(payload.errorMessage || "Command failed.");
        return;
      }

      const actionResult = executeActions(payload.actions);
      setAnswerText(payload.answerText);
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
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unexpected error while sending command."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void executeCommand();
    }
  };

  const handleSubmitClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    void executeCommand();
  };

  return (
    <div className={cn("relative w-full", className)}>
      {answerText && (
        <div className="mb-3 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-slate-700 dark:text-stone-300">
          <div className="flex items-start justify-between gap-2">
            <p className="leading-relaxed">{answerText}</p>
            <button
              type="button"
              onClick={() => setAnswerText(null)}
              className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors"
              aria-label="Dismiss AI response"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div
          className={cn(
            "relative flex items-center border bg-white dark:bg-stone-900 shadow-sm transition-all duration-200",
            "hover:shadow-md focus-within:shadow-md",
            error
              ? "border-red-300 dark:border-red-800 focus-within:border-red-400 dark:focus-within:border-red-700"
              : "border-slate-200 dark:border-stone-700 focus-within:border-slate-300 dark:focus-within:border-stone-600",
            isMobile ? "rounded-xl" : "rounded-2xl"
          )}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => {
              const nextValue = e.target.value;
              const isOverLimit = nextValue.length > COMMAND_QUERY_MAX_CHARS;
              const value = nextValue.slice(0, COMMAND_QUERY_MAX_CHARS);
              setInput(value);
              if (isOverLimit) {
                setError(
                  `Please keep messages under ${COMMAND_QUERY_MAX_CHARS} characters.`
                );
              } else if (error) {
                setError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
            className={cn(
              "flex-1 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-stone-500",
              "text-slate-900 dark:text-stone-100 font-normal caret-slate-900 dark:caret-stone-100",
              "focus:caret-slate-900 dark:focus:caret-stone-100",
              isMobile ? "px-3 py-2.5 pr-10 text-sm" : "px-4 py-3 pr-12 text-sm"
            )}
            aria-label="Command input for timezone queries"
            aria-describedby={error ? "command-error-text" : "command-helper-text"}
            disabled={isProcessing}
          />
          <button
            onClick={handleSubmitClick}
            disabled={!input.trim() || isProcessing}
            className={cn(
              "absolute transition-all duration-200",
              "bg-slate-900 dark:bg-stone-100 text-white dark:text-stone-900",
              "hover:bg-slate-800 dark:hover:bg-stone-200",
              "disabled:bg-slate-200 dark:disabled:bg-stone-700 disabled:text-slate-400 dark:disabled:text-stone-500",
              "focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-stone-500 focus:ring-offset-2",
              isMobile ? "right-1.5 p-1.5 rounded-lg" : "right-2 p-2 rounded-lg"
            )}
            aria-label="Execute command"
          >
            {isProcessing ? (
              <Loader2
                className={cn(
                  "animate-spin",
                  isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
                )}
              />
            ) : (
              <ArrowUp className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
            )}
          </button>
        </div>
      </div>

      {!isMobile && (
        <div className="mt-2 px-1 min-h-[20px]">
          {error ? (
            <p id="command-error-text" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : (
            <p id="command-helper-text" className="text-xs text-slate-500 dark:text-stone-400">
              Ask in natural language • Powered by OpenRouter.
            </p>
          )}
        </div>
      )}

      {isMobile && error && (
        <div className="mt-2 px-1 min-h-[20px]">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
