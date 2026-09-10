import { Button } from "@repo/design-system/components/ui/button";
import {
  formatMoney,
  formatPriceType,
  leadSite,
  type VehicleListing,
} from "@repo/marketplace";
import { CircleDollarSign, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import {
  getApproximateConvertedPrice,
  getListingContactAction,
  getPrimaryListingPrice,
} from "../lib/listing-truth";
import {
  getSellerPanelContactLabel,
  getSellerPanelCopy,
  getSellerPanelTransactionLabel,
  isMonthlySellerPanelTransaction,
} from "../lib/seller-contact-policy";
import { getLocalizedPublicPath } from "../lib/public-path";

export const SellerTransactionCard = ({
  contactHref,
  listing,
  locale,
}: {
  contactHref?: string;
  listing: VehicleListing;
  locale?: string;
}) => {
  const contactAction = getListingContactAction(
    listing,
    Boolean(contactHref),
    locale
  );
  const copy = getSellerPanelCopy({
    defaultContactLabel: getSellerPanelContactLabel({
      contactHref,
      fallback: contactAction.label,
      locale,
    }),
    locale,
  });
  const primaryPrice = getPrimaryListingPrice(listing);
  const approximatePrice = getApproximateConvertedPrice(listing);
  const transactionLabel = getSellerPanelTransactionLabel(
    listing.priceType,
    copy
  );
  const isMonthlyTransaction = isMonthlySellerPanelTransaction(
    listing.priceType
  );

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      data-slot="listing-transaction-card"
    >
      <p className="font-medium text-foreground/70 text-sm">
        {transactionLabel}
      </p>
      <p className="mt-1 font-semibold text-2xl tracking-tight">
        {formatMoney(primaryPrice, locale)}
        {isMonthlyTransaction ? `/${copy.month}` : ""}
      </p>
      {approximatePrice ? (
        <p className="mt-1 text-muted-foreground text-sm">
          ≈ {formatMoney(approximatePrice, locale)}
        </p>
      ) : (
        <p className="mt-1 text-muted-foreground text-sm">
          {formatPriceType(listing.priceType, locale)}
          {!isMonthlyTransaction && listing.monthlyEstimate
            ? ` · ~${formatMoney(listing.monthlyEstimate, locale)}/${copy.month}`
            : ""}
        </p>
      )}
      <div className="mt-4 hidden flex-col gap-2 lg:flex">
        {contactHref && !contactAction.disabled ? (
          <Button asChild className="h-12 w-full gap-2 rounded-lg">
            <Link href={contactHref}>
              {contactHref.startsWith("tel:") ? (
                <Phone aria-hidden="true" className="size-4" />
              ) : (
                <MessageCircle aria-hidden="true" className="size-4" />
              )}
              {copy.contact}
            </Link>
          </Button>
        ) : (
          <output className="flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left">
            <MessageCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <span>
              <span className="block font-medium text-foreground text-sm">
                {copy.contact}
              </span>
              <span className="mt-0.5 block text-micro text-muted-foreground">
                {copy.contactUnavailableHint}
              </span>
            </span>
          </output>
        )}
        {leadSite.staticDemoMode ? (
          <Button
            asChild
            className="h-11 w-full gap-2 rounded-lg"
            variant="secondary"
          >
            <Link href={getLocalizedPublicPath(locale, "/lease")}>
              <CircleDollarSign aria-hidden="true" className="size-4" />
              {copy.viewFinancing}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
};
