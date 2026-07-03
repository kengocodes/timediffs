import Link from "next/link";
import type { Metadata } from "next";
import { Temporal } from "@/lib/temporal";
import { LogoIcon } from "@/components/logo-icon";
import { createMetadata, getWebPageStructuredData } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy - timediffs.app",
  description:
    "Privacy policy for timediffs.app - We don't collect your data. Everything runs in your browser, and your preferences stay with you.",
  path: "/privacy",
  structuredData: getWebPageStructuredData({
    title: "Privacy Policy - timediffs.app",
    description:
      "Privacy policy for timediffs.app - We don't collect your data. Everything runs in your browser, and your preferences stay with you.",
    path: "/privacy",
  }),
});

export default function PrivacyPage() {
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
            <h1 className="text-xl font-medium tracking-tight">timediffs.app</h1>
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
                <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                <span>Back to timediffs.app</span>
              </Link>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">
              Last updated: {Temporal.Now.plainDateISO().toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>

            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-xl font-semibold mb-3">We Don't Track You</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At timediffs.app, we don't track you. That's our privacy policy in a nutshell. We don't collect, store, or share your personal information. Everything runs in your browser, and your preferences stay with you.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">What We Don't Do</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  To be completely clear, here's what we don't do:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>We don't use cookies, tracking pixels, or any tracking technologies</li>
                  <li>We don't collect analytics, usage data, or behavioral information</li>
                  <li>We don't store your timezone selections, dates, or preferences on our servers</li>
                  <li>We don't require accounts, registration, or any personal information</li>
                  <li>We don't share data with third parties because we don't collect any data</li>
                  <li>We don't use third-party analytics, advertising, or tracking services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">How the App Works</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  timediffs.app runs entirely in your browser. The app may detect your browser's timezone setting to suggest a default timezone, but this information is used only locally and never sent to our servers. Your timezone selections, date preferences, and other settings are stored only in your browser's URL. This means:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>URLs contain your timezone selections and can be shared</li>
                  <li>URLs may be stored in your browser history</li>
                  <li>Nothing is sent to our servers except standard web requests to load the app</li>
                  <li>You can clear your data by closing the browser tab or clearing your browser history</li>
                  <li>The app doesn't load external scripts that could track you</li>
                  <li>Copying a link writes to your clipboard only—the app never reads clipboard content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Standard Web Requests</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Like any website, when you visit timediffs.app, your browser automatically sends some information as part of standard web protocol, such as your IP address and browser type. This information is not stored or used by us. Your hosting provider may log this information as part of standard server operations, but we don't access, use, or retain these logs.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Under privacy laws like GDPR and CCPA, you have rights regarding your personal data. Since we don't collect personal data, these rights don't apply in the traditional sense, but we want you to know:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>You have the right to know what data is collected (answer: none)</li>
                  <li>You have the right to access your data (answer: we don't have any)</li>
                  <li>You have the right to delete your data (answer: it's already in your control—clear your browser history)</li>
                  <li>You have the right to opt out of data collection (answer: there's nothing to opt out of)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Your data never leaves your browser, so you're always in control.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is not directed to children under 13 (or under 16 in the EU). Since we don't collect personal information from anyone, we also don't knowingly collect personal information from children. If you're a parent or guardian and believe your child has provided us with personal information, please note that we don't collect such information, so there's nothing for us to delete.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Data Controller</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For the purposes of GDPR and other privacy laws, timediffs.app is the data controller. However, since we don't collect or process personal data, there's no data processing to control.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this privacy policy from time to time. When we do, we'll update the "Last updated" date at the top of this page. Since we don't collect contact information, we can't notify you directly of changes, but you can check this page anytime to see the current policy. Your continued use of timediffs.app after any changes means you accept the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">Open Source Transparency</h2>
                <p className="text-muted-foreground leading-relaxed">
                  timediffs.app is a free, open-source personal project. The complete source code is publicly available on{" "}
                  <a
                    href="https://github.com/mochixlb/timediffs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline hover:opacity-80"
                  >
                    GitHub
                  </a>
                  , which means you can review exactly how the app works and verify our privacy claims yourself. This transparency is one of the best ways to ensure your privacy is protected.
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
                  to verify our privacy claims firsthand. For questions about service usage, see our{" "}
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

