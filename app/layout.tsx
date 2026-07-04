import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { TimezoneProviderWrapper } from "@/components/timezone-provider-wrapper";
import { ThemeProvider } from "@/contexts/theme-context";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { siteConfig, createMetadata, getWebApplicationStructuredData } from "@/lib/seo";
import { FooterWrapper } from "@/components/footer-wrapper";
import { viewport } from "./viewport";

const baseMetadata = createMetadata({
  title: "Timediffs - Timezone Comparison Tool",
  description: siteConfig.description,
  path: "/",
  structuredData: getWebApplicationStructuredData(),
});

export const metadata: Metadata = {
  ...baseMetadata,
  metadataBase: new URL(siteConfig.url),
  keywords: [
    "timezone",
    "timezone comparison",
    "world clock",
    "time converter",
    "timezone converter",
    "compare timezones",
    "time zone",
    "UTC",
    "GMT",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    ...(baseMetadata.other || {}),
  },
};

export { viewport };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('timediffs-theme');
                  var modes = { light: 'light', dark: 'dark', indigo: 'dark', blossom: 'light' };
                  if (!modes[theme]) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(modes[theme]);
                  if (theme !== 'light' && theme !== 'dark') {
                    document.documentElement.classList.add('theme-' + theme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={GeistSans.className}>
        <ThemeProvider>
          <div className="flex min-h-[100svh] flex-col">
            <main className="flex-1">
              <NuqsAdapter>
                <Suspense fallback={<LoadingSpinner />}>
                  <TimezoneProviderWrapper>{children}</TimezoneProviderWrapper>
                </Suspense>
              </NuqsAdapter>
            </main>
            <FooterWrapper />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
