import { Button } from "@repo/design-system/components/ui/button";
import type { VehicleListing } from "@repo/marketplace";
import { Flag, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { getListingContactAction } from "../lib/listing-truth";

interface MobileContactBarProps {
  readonly contactHref?: string;
  readonly listing: VehicleListing;
  readonly locale?: string;
  readonly reportHref?: string;
}

export const MobileContactBar = ({
  contactHref,
  listing,
  locale,
  reportHref,
}: MobileContactBarProps) => {
  const action = getListingContactAction(listing, Boolean(contactHref), locale);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const directPhone = contactHref?.startsWith("tel:") ?? false;
  let actionLabel = action.label;
  if (directPhone) {
    actionLabel = isBg ? "Обадете се" : "Call dealer";
  }
  const reportLabel = isBg ? "Докладвай обявата" : "Report listing";

  if (!(contactHref && !action.disabled)) {
    return (
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-4 lg:hidden">
        <output className="flex min-h-10 flex-1 items-center gap-2 rounded-lg bg-secondary px-3 text-muted-foreground text-sm">
          <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
          {actionLabel}
        </output>
        {reportHref ? (
          <Button
            asChild
            className="size-10 shrink-0 rounded-lg"
            size="icon"
            variant="secondary"
          >
            <Link
              aria-label={reportLabel}
              href={reportHref}
              title={reportLabel}
            >
              <Flag aria-hidden="true" className="size-4" />
              <span className="sr-only">{reportLabel}</span>
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-lg gap-2">
        <Button
          asChild
          className="h-12 flex-1 gap-2 rounded-xl bg-zinc-950 font-semibold text-white shadow-none hover:bg-black active:bg-black"
        >
          <Link href={contactHref}>
            {directPhone ? (
              <Phone aria-hidden="true" className="size-4" />
            ) : (
              <MessageCircle aria-hidden="true" className="size-4" />
            )}
            {actionLabel}
          </Link>
        </Button>
        {reportHref ? (
          <Button
            asChild
            className="size-12 shrink-0 rounded-xl bg-zinc-100 shadow-none"
            size="icon"
            variant="secondary"
          >
            <Link
              aria-label={reportLabel}
              href={reportHref}
              title={reportLabel}
            >
              <Flag aria-hidden="true" className="size-4" />
              <span className="sr-only">{reportLabel}</span>
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
};
