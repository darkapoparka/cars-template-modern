import { isDealershipSite } from "@repo/marketplace/site-config";
import {
  DealerBottomNav,
  DealerMobileBrandBar,
  MobileDealerChrome,
} from "@repo/marketplace-ui";
import { DealerDesktopHeader } from "@repo/marketplace-ui/components/dealer-desktop-header";
import { DealerDesktopHero } from "@repo/marketplace-ui/components/dealer-desktop-hero";
import type { ReactNode } from "react";

/** The recovery states reuse showroom navigation without importing server-only page composition. */
export function PublicRecoveryFrame({
  locale,
  children,
  desktopTitle,
}: {
  readonly locale: "bg" | "en";
  readonly children: ReactNode;
  readonly desktopTitle?: string;
}) {
  return (
    <div
      className={`flex min-h-[100dvh] flex-col bg-background text-foreground ${isDealershipSite ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0" : ""}`}
    >
      {isDealershipSite ? (
        <header className="bg-black text-white lg:hidden">
          <MobileDealerChrome
            brandRow={
              <DealerMobileBrandBar isBg={locale === "bg"} locale={locale} />
            }
          />
        </header>
      ) : null}
      {isDealershipSite ? (
        <DealerDesktopHeader activeMode={null} locale={locale} />
      ) : null}
      {isDealershipSite && desktopTitle ? (
        <DealerDesktopHero title={desktopTitle} variant="compact" />
      ) : null}
      {children}
      {isDealershipSite ? <DealerBottomNav locale={locale} /> : null}
    </div>
  );
}
