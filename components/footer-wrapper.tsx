"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

export function FooterWrapper() {
  const pathname = usePathname();
  const isLegalPage = pathname === "/privacy" || pathname === "/terms";

  return (
    <>
      {/* Footer - Fixed on desktop except for legal pages */}
      <div
        className={
          isLegalPage ? "" : "lg:fixed lg:bottom-0 lg:left-0 lg:right-0 lg:z-30"
        }
      >
        <Footer />
      </div>
      {/* Spacer to ensure footer can be fully viewed on small screens with a fixed bottom menu */}
      {!isLegalPage && (
        <>
          <div
            className="lg:hidden h-24 safe-area-inset-bottom"
            aria-hidden="true"
          />
          {/* Spacer for desktop footer */}
          <div className="hidden lg:block h-24" aria-hidden="true" />
        </>
      )}
    </>
  );
}
