import Link from "next/link";
import type { Metadata } from "next";
import { Temporal } from "@/lib/temporal";
import { LogoIcon } from "@/components/logo-icon";
import { createMetadata, getWebPageStructuredData } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Terms of Use - timediffs.app",
  description:
    "Terms of use for timediffs.app, including AI command behavior, acceptable use, and service limitations.",
  path: "/terms",
  structuredData: getWebPageStructuredData({
    title: "Terms of Use - timediffs.app",
    description:
      "Terms of use for timediffs.app, including AI command behavior, acceptable use, and service limitations.",
    path: "/terms",
  }),
});

export default function TermsPage() {
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
                  By using timediffs.app, you agree to these Terms of Use. If
                  you do not agree, please do not use the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Description of Service
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is a free timezone comparison tool. It includes
                  optional natural language commands processed through an AI
                  provider to help with timezone, date, and holiday requests.
                  The service is provided "as is" and may change at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">AI Feature Scope</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  The natural language input is intended only for timezone, date,
                  and holiday use cases. We may block requests that are outside
                  this scope or that trigger safety protections.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Command length limits may apply</li>
                  <li>Rate limits may apply</li>
                  <li>
                    Requests that look abusive or unsafe may be rejected
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">No Warranties</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, timediffs.app IS
                  PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
                  KIND, INCLUDING WARRANTIES OF ACCURACY, RELIABILITY, FITNESS
                  FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Use at Your Own Risk</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for verifying important times and schedules.
                  Do not rely solely on this service for critical deadlines,
                  legal obligations, financial deadlines, travel requirements, or
                  emergency decisions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Limitation of Liability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                  DAMAGES, OR FOR LOST DATA, LOST PROFITS, OR MISSED EVENTS
                  ARISING FROM USE OF THE SERVICE.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Because this is a free service, total liability is limited to
                  $0.00 where allowed by law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  You agree not to use timediffs.app:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>To violate laws or third-party rights</li>
                  <li>To attempt unauthorized access or service disruption</li>
                  <li>To bypass safety controls or abuse model endpoints</li>
                  <li>To send malware or harmful payloads</li>
                  <li>To run automated abuse against service availability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Service Availability and Enforcement
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may add limits, reject requests, suspend access, or
                  discontinue features to protect reliability, security, and
                  abuse resistance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">
                  Open Source License
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app source code is available under the MIT License
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
                <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these terms at any time. Continued use after
                  updates means you accept the revised terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Questions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For privacy details, read our{" "}
                  <Link href="/privacy" className="text-foreground underline hover:opacity-80">
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
