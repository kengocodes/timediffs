"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Copy link button component that copies the current URL to clipboard.
 * Shows visual feedback when the URL is successfully copied.
 */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = window.location.href;

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleCopyLink}
      className="h-11 w-11 lg:h-9 lg:w-[100px] p-0 lg:px-3 lg:gap-2 rounded-lg lg:rounded-md lg:border lg:border-slate-300 dark:lg:border-stone-600 lg:bg-white dark:lg:bg-stone-900 text-sm font-medium text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 hover:bg-slate-100 dark:hover:bg-stone-800 lg:text-slate-700 dark:lg:text-stone-300 lg:hover:bg-slate-50 dark:lg:hover:bg-stone-800 shrink-0 transition-colors"
      aria-label={
        copied ? "Link copied to clipboard" : "Copy link to share this view"
      }
      title={copied ? "Link copied!" : "Copy link to share this view"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <span className="hidden lg:inline">Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4 shrink-0" />
          <span className="hidden lg:inline">Copy link</span>
        </>
      )}
    </Button>
  );
}
