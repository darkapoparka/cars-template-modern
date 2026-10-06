import { Button } from "@repo/design-system/components/ui/button";
import {
  formatMoney,
  formatPriceType,
  type VehicleListing,
} from "@repo/marketplace";
import { isDealershipSite, publicSite } from "@repo/marketplace/site-config";
import { CircleDollarSign, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  getApproximateConvertedPrice,
  getListingContactAction,
  getPrimaryListingPrice,
} from "../lib/listing-truth";
import { getLocalizedPublicPath } from "../lib/public-path";
import {
  getSellerPanelContactLabel,
  getSellerPanelCopy,
  getSellerPanelTransactionLabel,
  isMonthlySellerPanelTransaction,
} from "../lib/seller-contact-policy";
import { DealerListingPurchaseOptions } from "./dealer-listing-purchase-options";
import desktopStyles from "./listing-detail-desktop.module.css";

function DealerPurchaseCard({
  contactButton,
  listing,
  locale,
}: {
  contactButton: ReactNode;
  listing: VehicleListing;
  locale?: string;
}) {
  const isBg = locale?.startsWith("bg");
  const text = (bg: string, en: string) => (isBg ? bg : en);
  const primaryPrice = getPrimaryListingPrice(listing);
  const approximatePrice = getApproximateConvertedPrice(listing);
  const copy = getSellerPanelCopy({ defaultContactLabel: "", locale });
  const financeLabel = listing.monthlyEstimate
    ? text("Ориентировъчна вноска", "Estimated payment")
    : text("Индивидуална оферта", "A tailored quote");
  const financeHref = `${getLocalizedPublicPath(locale, "/lease")}?vehicle=${encodeURIComponent(listing.id)}`;
  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      data-slot="listing-transaction-card"
    >
      <DealerListingPurchaseOptions
        finance={
          <>
            <p className={desktopStyles.purchaseLabel}>{financeLabel}</p>
            {listing.monthlyEstimate ? (
              <p
                className={desktopStyles.financePrice}
                data-slot="listing-finance-estimate"
              >
                ~{formatMoney(listing.monthlyEstimate, locale)}
                <span>/{copy.month}</span>
              </p>
            ) : null}
            <p className={desktopStyles.purchaseHint}>
              {isBg
                ? "Срокът и първоначалната вноска се уточняват с екипа."
                : "Confirm the term and initial payment with the team."}
            </p>
            <div className={desktopStyles.purchaseActions}>
              <Button asChild className="h-12 w-full gap-2 rounded-lg">
                <Link href={financeHref}>
                  {isBg ? "Вижте възможностите" : "Explore financing"}
                  <CircleDollarSign aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </>
        }
        locale={locale}
        purchase={
          <>
            <p className={desktopStyles.purchaseLabel}>
              {isBg ? "Цена на автомобила" : "Vehicle price"}
            </p>
            <p
              className="font-semibold tracking-heading"
              data-slot="listing-transaction-price"
            >
              {formatMoney(primaryPrice, locale)}
            </p>
            <p className={desktopStyles.purchaseHint}>
              {formatPriceType(listing.priceType, locale)}
              {approximatePrice
                ? ` · ≈ ${formatMoney(approximatePrice, locale)}`
                : ""}
            </p>
            <div className={desktopStyles.purchaseActions}>{contactButton}</div>
          </>
        }
      />
    </section>
  );
}

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
  const contactButton =
    contactHref && !contactAction.disabled ? (
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
          <span className="block font-medium text-foreground text-meta">
            {copy.contact}
          </span>
          <span className="mt-0.5 block text-meta text-muted-foreground">
            {copy.contactUnavailableHint}
          </span>
        </span>
      </output>
    );

  if (
    isDealershipSite &&
    publicSite.services.lease &&
    listing.category === "car" &&
    !isMonthlyTransaction
  ) {
    return (
      <DealerPurchaseCard
        contactButton={contactButton}
        listing={listing}
        locale={locale}
      />
    );
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      data-slot="listing-transaction-card"
    >
      <p className="font-medium text-foreground/70 text-meta">
        {transactionLabel}
      </p>
      <p
        className="mt-1 font-semibold text-price-lg tracking-heading"
        data-slot="listing-transaction-price"
      >
        {formatMoney(primaryPrice, locale)}
        {isMonthlyTransaction ? `/${copy.month}` : ""}
      </p>
      {approximatePrice ? (
        <p className="mt-1 text-meta text-muted-foreground">
          ≈ {formatMoney(approximatePrice, locale)}
        </p>
      ) : (
        <p className="mt-1 text-meta text-muted-foreground">
          {formatPriceType(listing.priceType, locale)}
          {!isMonthlyTransaction && listing.monthlyEstimate
            ? ` · ~${formatMoney(listing.monthlyEstimate, locale)}/${copy.month}`
            : ""}
        </p>
      )}
      <div className="mt-4 hidden flex-col gap-2 lg:flex">
        {contactButton}
        {isDealershipSite ? (
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
