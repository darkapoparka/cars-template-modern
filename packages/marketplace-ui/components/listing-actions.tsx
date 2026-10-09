"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { Heart, LoaderCircle, Printer, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  getListingActionCopy,
  isListingShareCancellation,
  shareListing,
} from "../lib/listing-action-policy";
import { mobileImageIconActionClassName } from "../lib/mobile-header-icon-action";

interface ListingActionsProps {
  readonly compactLabel?: boolean;
  readonly floating?: boolean;
  readonly iconOnly?: boolean;
  readonly listingTitle: string;
  readonly listingUrl: string;
  readonly locale?: string;
  readonly saveHref?: string;
  readonly showPrint?: boolean;
}

export const ListingActions = ({
  floating = false,
  compactLabel = false,
  iconOnly = false,
  listingTitle,
  listingUrl,
  locale,
  saveHref,
  showPrint = true,
}: ListingActionsProps) => {
  const copy = getListingActionCopy(locale);
  const shortShareLabel = locale?.startsWith("bg") ? "Сподели" : "Share";
  const [sharePending, setSharePending] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const actionClassName = cn(
    floating ? mobileImageIconActionClassName : "size-10 rounded-lg"
  );

  const handleShare = async () => {
    if (sharePending) {
      return;
    }

    setSharePending(true);
    setShareStatus(copy.shareStatus.pending);
    try {
      const outcome = await shareListing(listingTitle, listingUrl);
      setShareStatus(copy.shareStatus[outcome]);
    } catch (error) {
      setShareStatus(
        isListingShareCancellation(error)
          ? copy.shareStatus.cancelled
          : copy.shareStatus.failed
      );
    } finally {
      setSharePending(false);
    }
  };

  return (
    <div className="flex items-center gap-2" data-slot="listing-actions">
      {saveHref ? (
        <Button
          asChild
          className={actionClassName}
          size="icon"
          variant="secondary"
        >
          <Link aria-label={copy.save} href={saveHref}>
            <Heart aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      ) : null}
      {floating || !showPrint ? null : (
        <Button
          aria-label={copy.print}
          className={actionClassName}
          onClick={() => window.print()}
          size="icon"
          title={copy.print}
          type="button"
          variant="secondary"
        >
          <Printer aria-hidden="true" className="size-4" />
          <span className="hidden lg:inline">{copy.print}</span>
        </Button>
      )}
      <Button
        aria-busy={sharePending}
        aria-label={copy.share}
        className={actionClassName}
        disabled={sharePending}
        onClick={handleShare}
        size="icon"
        title={iconOnly ? copy.share : undefined}
        type="button"
        variant="secondary"
      >
        {sharePending ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Share2 aria-hidden="true" className="size-4" />
        )}
        {floating || iconOnly ? null : (
          <span className="hidden lg:inline">
            {compactLabel ? shortShareLabel : copy.share}
          </span>
        )}
      </Button>
      <span aria-live="polite" className="sr-only">
        {shareStatus}
      </span>
    </div>
  );
};
