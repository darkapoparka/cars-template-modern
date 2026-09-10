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

interface ListingActionsProps {
  readonly floating?: boolean;
  readonly listingTitle: string;
  readonly listingUrl: string;
  readonly locale?: string;
  readonly saveHref?: string;
}

export const ListingActions = ({
  floating = false,
  listingTitle,
  listingUrl,
  locale,
  saveHref,
}: ListingActionsProps) => {
  const copy = getListingActionCopy(locale);
  const [sharePending, setSharePending] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const actionClassName = cn(
    floating
      ? "size-11 rounded-full border border-border/70 bg-card/95 shadow-sm backdrop-blur"
      : "size-10 rounded-lg"
  );

  const handleShare = async () => {
    if (sharePending) return;

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
      {floating ? null : (
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
        </Button>
      )}
      <Button
        aria-busy={sharePending}
        aria-label={copy.share}
        className={actionClassName}
        disabled={sharePending}
        onClick={handleShare}
        size="icon"
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
      </Button>
      <span aria-live="polite" className="sr-only">
        {shareStatus}
      </span>
    </div>
  );
};
