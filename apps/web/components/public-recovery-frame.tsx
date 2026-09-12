import { leadSite } from "@repo/marketplace";
import {
  DealerBottomNav,
  DealerMobileBrandBar,
  MobileDealerChrome,
} from "@repo/marketplace-ui";
import type { ReactNode } from "react";

/** The recovery states reuse showroom navigation without importing server-only page composition. */
export function PublicRecoveryFrame({
  locale,
  children,
}: {
  readonly locale: "bg" | "en";
  readonly children: ReactNode;
}) {
  return (
    <div
      className={`flex min-h-[100dvh] flex-col bg-background text-foreground ${leadSite.staticDemoMode ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0" : ""}`}
    >
      {leadSite.staticDemoMode ? (
        <header className="bg-black text-white lg:hidden">
          <MobileDealerChrome
            brandRow={
              <DealerMobileBrandBar isBg={locale === "bg"} locale={locale} />
            }
          />
        </header>
      ) : null}
      {children}
      {leadSite.staticDemoMode ? <DealerBottomNav locale={locale} /> : null}
    </div>
  );
}
