import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

/** Shared safe-area, brand and optional primary-control slots. */
export function MobileDealerChrome({
  brandRow,
  children,
  title,
  titleClassName,
  titleId,
}: {
  brandRow: ReactNode;
  children?: ReactNode;
  title?: string;
  titleClassName?: string;
  titleId?: string;
}) {
  const hasPrimaryContent = Boolean(title || children);
  return (
    <div
      className={`px-4 pt-[max(0.75rem,env(safe-area-inset-top))] ${hasPrimaryContent ? "pb-6" : "pb-3"}`}
      data-slot="mobile-dealer-chrome"
    >
      <div className="relative h-11" data-slot="mobile-dealer-brand-row">
        {brandRow}
      </div>
      {hasPrimaryContent ? (
        <div className="mt-3" data-slot="mobile-dealer-primary-control">
          {title ? (
            <h1
              className={cn(
                "text-center font-semibold text-mobile-page-title tracking-heading",
                children && "mb-3",
                titleClassName
              )}
              data-slot="mobile-dealer-title"
              id={titleId}
              tabIndex={titleId ? -1 : undefined}
            >
              {title}
            </h1>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}

export const mobileDealerContentClassName =
  "relative -mt-3 rounded-t-2xl bg-background px-4 pt-3";
