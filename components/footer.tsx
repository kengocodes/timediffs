import Link from "next/link";
import type { SVGProps } from "react";
import { siteConfig } from "@/lib/seo";
import { LogoIcon } from "@/components/logo-icon";

function GitHubLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.93c.57.1.78-.25.78-.55l-.02-2.13c-3.2.69-3.88-1.54-3.88-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.27-5.23-5.68 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.19 1.18a11.1 11.1 0 0 1 5.8 0c2.22-1.5 3.19-1.18 3.19-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.67.41.36.77 1.08.77 2.18l-.01 3.23c0 .3.2.65.79.54A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export function Footer() {
  const githubUrl = "https://github.com/mochixlb/timediffs";

  return (
    <footer
      className="w-full border-t bg-background safe-area-inset-bottom"
      aria-label="Site footer"
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-6 xl:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-center md:justify-between py-6 md:py-8">
          {/* Mobile layout: refined, elegant design */}
          <div className="w-full md:hidden">
            {/* Logo and Title Section */}
            <div className="flex flex-col items-center mb-4">
              <div className="flex items-center gap-2.5 mb-1">
                <LogoIcon className="h-7 w-7 text-foreground shrink-0" />
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  timediffs.app
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {siteConfig.description}
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-border mb-4" aria-hidden="true" />

            {/* Links - each on its own row */}
            <nav
              className="flex flex-col items-center gap-2 text-xs text-muted-foreground"
              aria-label="Footer links"
            >
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors px-4 py-3 min-h-[44px] flex items-center justify-center touch-manipulation w-full"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors px-4 py-3 min-h-[44px] flex items-center justify-center touch-manipulation w-full"
              >
                Terms of Use
              </Link>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-4 py-3 min-h-[44px] touch-manipulation w-full"
                aria-label="View project on GitHub (opens in a new tab)"
                title="GitHub"
              >
                <GitHubLogo className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </nav>
          </div>

          {/* Desktop/tablet layout */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* Left cluster */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                © 2025 {siteConfig.name}
              </span>
              <nav className="flex items-center gap-3" aria-label="Legal">
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="select-none text-muted-foreground">·</span>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Use
                </Link>
              </nav>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground hidden lg:inline">
                {siteConfig.description}
              </span>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="View project on GitHub (opens in a new tab)"
                title="GitHub"
              >
                <GitHubLogo className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
