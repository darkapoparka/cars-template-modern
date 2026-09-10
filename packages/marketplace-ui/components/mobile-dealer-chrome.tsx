import type { ReactNode } from "react";

/** Shared geometry for the four mobile destinations, including safe-area space. */
export function MobileDealerChrome({
  brandRow,
  children,
}: {
  brandRow: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6 sm:px-4"
      data-slot="mobile-dealer-chrome"
    >
      <div className="relative h-11" data-slot="mobile-dealer-brand-row">
        {brandRow}
      </div>
      <div className="mt-2 h-[52px]" data-slot="mobile-dealer-primary-control">
        {children}
      </div>
    </div>
  );
}

export const mobileDealerContentClassName =
  "relative -mt-3 rounded-t-2xl bg-background px-4 pt-3";
