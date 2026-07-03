"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface AiResponseMarkdownProps {
  content: string;
  className?: string;
}

function normalizeMarkdownContent(content: string): string {
  // Some model responses escape markdown punctuation (for JSON safety),
  // which causes visible literal tokens such as \*\*bold\*\*.
  const unescapedMarkdown = content.replace(
    /\\([\\`*_{}\[\]()#+\-.!|>~])/g,
    "$1",
  );

  // Handle occasional HTML-entity encoded asterisks from model output.
  return unescapedMarkdown
    .replaceAll("&ast;", "*")
    .replaceAll("&#42;", "*")
    .replaceAll("&#x2A;", "*");
}

export function AiResponseMarkdown({
  content,
  className,
}: AiResponseMarkdownProps) {
  const normalizedContent = normalizeMarkdownContent(content);

  return (
    <div
      className={cn(
        "text-sm",
        "[&_p]:mb-2 [&_p]:leading-relaxed [&_p:last-child]:mb-0",
        "[&_strong]:font-semibold",
        "[&_em]:italic",
        "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul:last-child]:mb-0",
        "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol:last-child]:mb-0",
        "[&_li]:mb-1 [&_li:last-child]:mb-0",
        "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] dark:[&_code]:bg-stone-800",
        "[&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} rel="noopener noreferrer" target="_blank" />
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
