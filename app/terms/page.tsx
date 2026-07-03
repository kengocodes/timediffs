import Link from "next/link";
import type { Metadata } from "next";
import { Temporal } from "@/lib/temporal";
import { LogoIcon } from "@/components/logo-icon";
import { createMetadata, getWebPageStructuredData } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Terms of Use - timediffs.app",
  description:
    "Terms of use for timediffs.app - A free, open-source timezone comparison tool provided as-is.",
  path: "/terms",
  structuredData: getWebPageStructuredData({
    title: "Terms of Use - timediffs.app",
    description:
      "Terms of use for timediffs.app - A free, open-source timezone comparison tool provided as-is.",
    path: "/terms",
  }),
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-3 py-4 lg:px-6 lg:py-8 xl:px-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
          >
            <LogoIcon className="h-5 w-5 text-foreground shrink-0" />
            <h1 className="text-xl font-medium tracking-tight">
              timediffs.app
            </h1>
          </Link>
        </header>

        {/* Content */}
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
              Terms of Use
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
                <h2 className="text-xl font-semibold mb-3">
                  Acceptance of Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using timediffs.app, you agree to be bound by
                  these Terms of Use. If you don't agree to these terms, please
                  don't use the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Description of Service
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is a free, open-source personal project that
                  helps you compare multiple timezones side-by-side. The app may
                  detect your browser's timezone setting to suggest a default
                  timezone, but you can override this at any time. All
                  preferences are stored in your browser's URL and may be saved
                  in your browser history. The service is provided "as is" and
                  "as available" at no cost. We reserve the right to modify,
                  suspend, or discontinue the service at any time without
                  notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">No Warranties</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, timediffs.app IS
                  PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
                  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    Warranties of merchantability, fitness for a particular
                    purpose, or non-infringement
                  </li>
                  <li>
                    Warranties regarding the accuracy, reliability, or
                    availability of the service
                  </li>
                  <li>
                    Warranties that the service will be uninterrupted, secure,
                    or error-free
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Timezone data is based on publicly available timezone
                  databases, but we make no guarantees about its accuracy,
                  completeness, or timeliness. Timezone rules change, and we
                  can't guarantee the information is always current or correct.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Use at Your Own Risk
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is a tool to help you compare timezones, but
                  you're solely responsible for verifying important times
                  yourself. Don't rely solely on this service for critical
                  scheduling decisions, meetings, deadlines, or any
                  time-sensitive matters. Always verify times independently,
                  especially for important events.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  You're also responsible for what you share. When you share
                  URLs from timediffs.app, those URLs contain your timezone
                  selections and may reveal location-related information. Be
                  mindful of what you share and with whom.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Limitation of Liability
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE
                  FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                  PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                  INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE,
                  GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Your use or inability to use timediffs.app</li>
                  <li>
                    Any errors or inaccuracies in the timezone information
                    provided
                  </li>
                  <li>
                    Missed meetings, scheduling errors, or other consequences of
                    relying on the service
                  </li>
                  <li>Any unauthorized access to or use of our servers</li>
                  <li>
                    Any interruption or cessation of transmission to or from the
                    service
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Our total liability for any claims arising from your use of
                  timediffs.app shall not exceed zero dollars ($0.00), as the
                  service is provided free of charge.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify, defend, and hold harmless
                  timediffs.app and its operators from any claims, damages,
                  losses, liabilities, and expenses (including legal fees)
                  arising from your use of the service or your violation of
                  these Terms of Use.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Service Availability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We don't guarantee that timediffs.app will always be
                  available, uninterrupted, or error-free. The service may be
                  unavailable due to maintenance, technical issues, server
                  problems, or other reasons beyond our control. We're not
                  responsible for any losses or damages resulting from service
                  unavailability.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Open Source License
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  timediffs.app is open-source software. The source code is
                  publicly available and licensed under the MIT License, which
                  means:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    You're free to use, copy, modify, and distribute the code
                  </li>
                  <li>You can use it for personal or commercial purposes</li>
                  <li>
                    You can review the source code to understand how it works
                  </li>
                  <li>The code is provided "as is" without any warranties</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  The complete license terms are available in the{" "}
                  <a
                    href="https://github.com/mochixlb/timediffs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline hover:opacity-80"
                  >
                    source code repository
                  </a>
                  . Timezone data comes from publicly available timezone
                  databases and is used in accordance with their respective
                  licenses.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Intellectual Property
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  The timediffs.app website, its design, code, and content are
                  available under the MIT License. This means you have broad
                  rights to use, modify, and distribute the code, subject to the
                  license terms.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  When using timediffs.app, you may not remove copyright notices
                  or license information from the code. If you create derivative
                  works based on timediffs.app, you should include appropriate
                  attribution and license information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You agree not to use timediffs.app:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>
                    In any way that violates any applicable law, regulation, or
                    third-party right
                  </li>
                  <li>
                    To engage in any illegal, fraudulent, or harmful activity
                  </li>
                  <li>
                    To transmit any viruses, malware, or other harmful code
                  </li>
                  <li>
                    To attempt to gain unauthorized access to our systems or
                    interfere with the service
                  </li>
                  <li>
                    To use automated systems (bots, scrapers, etc.) to access
                    the service in ways that could harm its availability or
                    performance
                  </li>
                  <li>To infringe on intellectual property rights of others</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate your access to
                  timediffs.app at any time, with or without cause or notice,
                  for any reason, including if you violate these Terms of Use.
                  We may also modify or discontinue the service at any time
                  without notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these Terms of Use at any time. When we do,
                  we'll update the "Last updated" date at the top of this page.
                  Your continued use of timediffs.app after any changes means
                  you accept the updated terms. If you don't agree to the
                  changes, you should stop using the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms of Use shall be governed by and construed in
                  accordance with applicable law, without regard to conflict of
                  law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Severability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If any provision of these Terms of Use is found to be invalid,
                  illegal, or unenforceable, the remaining provisions shall
                  continue in full force and effect.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Entire Agreement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms of Use, together with our{" "}
                  <Link
                    href="/privacy"
                    className="text-foreground underline hover:opacity-80"
                  >
                    Privacy Policy
                  </Link>
                  , constitute the entire agreement between you and
                  timediffs.app regarding your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Questions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Since timediffs.app is open-source, you can review the{" "}
                  <a
                    href="https://github.com/mochixlb/timediffs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline hover:opacity-80"
                  >
                    source code
                  </a>{" "}
                  to understand how it works. For privacy information, see our{" "}
                  <Link
                    href="/privacy"
                    className="text-foreground underline hover:opacity-80"
                  >
                    Privacy Policy
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
