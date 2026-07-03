import Link from "next/link";
import type { Metadata } from "next";
import { Temporal } from "@/lib/temporal";
import { LogoIcon } from "@/components/logo-icon";
import { createMetadata, getWebPageStructuredData } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy - timediffs.app",
  description:
    "Privacy policy for timediffs.app, including how timezone command requests are processed.",
  path: "/privacy",
  structuredData: getWebPageStructuredData({
    title: "Privacy Policy - timediffs.app",
    description:
      "Privacy policy for timediffs.app, including how timezone command requests are processed.",
    path: "/privacy",
  }),
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-3 py-4 lg:px-6 lg:py-8 xl:px-8">
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
          >
            <LogoIcon className="h-5 w-5 text-foreground shrink-0" />
            <h1 className="text-xl font-medium tracking-tight">timediffs.app</h1>
          </Link>
        </header>

        <main className="max-w-3xl mx-auto">
          <div className="prose prose-slate max-w-none">
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-all group"
              >
                <span className="transition-transform group-hover:-translate-x-0.5">
                  ←
                </span>
                <span>Back to timediffs.app</span>
              </Link>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">
              Last updated:{" "}
              {Temporal.Now.plainDateISO().toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-xl font-semibold mb-3">Privacy Summary</h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is designed to minimize data collection. We do
                  not require accounts, we do not run advertising trackers, and
                  we do not sell personal data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  What Data Is Processed
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When you use the app, the following data may be processed:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Standard web request data such as IP address and user agent
                  </li>
                  <li>
                    URL query parameters containing timezone/date view state
                  </li>
                  <li>
                    Natural language command text, only when you submit a
                    command in the input box
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Natural Language Input Processing
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  If you submit a natural language command, your message is sent
                  to our command API and then to OpenRouter for model
                  processing.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Only command-related context is sent</li>
                  <li>
                    Requests are filtered with safety checks before model calls
                  </li>
                  <li>
                    Out-of-scope or blocked inputs may be rejected without model
                    processing
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  OpenRouter is a third-party processor and has its own terms
                  and privacy policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  What Stays in Your Browser
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Most timezone rendering behavior runs client-side. Timezone
                  selections and date preferences are represented in the URL to
                  support sharing.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>URLs can be shared and may appear in browser history</li>
                  <li>
                    Browser timezone detection is used to suggest defaults
                  </li>
                  <li>
                    Copy link writes to clipboard only; the app does not read
                    clipboard content
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Security and Abuse Protections
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  To protect service reliability and reduce abuse, we use:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Input length limits</li>
                  <li>Rate limiting by IP</li>
                  <li>Scope allowlists and deny rules</li>
                  <li>Structured output validation before UI mutations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not maintain user accounts or profile databases.
                  Operational logs may exist through infrastructure and AI
                  providers for reliability, security, and billing. Retention of
                  those logs is governed by those providers.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is not directed to children under 13 (or under
                  16 in the EU). We do not intentionally collect personal data
                  from children.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Changes to This Policy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this policy from time to time. If we do, we will
                  update the "Last updated" date on this page.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Open Source Transparency
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is open source. You can review the implementation
                  in the{" "}
                  <a
                    href="https://github.com/mochixlb/timediffs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline hover:opacity-80"
                  >
                    GitHub repository
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Questions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For service usage terms, see our{" "}
                  <Link href="/terms" className="text-foreground underline hover:opacity-80">
                    Terms of Use
                  </Link>
                  .
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
