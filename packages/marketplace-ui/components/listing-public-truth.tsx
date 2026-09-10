import {
  formatMoney,
  formatPriceType,
  leadSite,
  type VehicleListing,
} from "@repo/marketplace";
import {
  Building2,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import {
  formatTruthDateTime,
  formatVehicleLocation,
  getApproximateConvertedPrice,
  getDeliveryTruth,
  getFreshnessLabel,
  getLandedCostTruth,
  getPhysicalVehicleLocation,
  getPrimaryListingPrice,
  getSourceLabel,
  isVerifiedImporter,
} from "../lib/listing-truth";

interface ListingPublicTruthProps {
  readonly compact?: boolean;
  readonly listing: VehicleListing;
  readonly locale?: string;
}

const getTruthCopy = (locale?: string) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;

  return isBg
    ? {
        advertisedPrice: "Обявена цена",
        approximateConversion: "Ориентировъчно превалутиране",
        approximateConversionAt: (date: string) =>
          `Ориентировъчно превалутиране към ${date}. Това не е първоначално обявената цена.`,
        approximateConversionWithoutDate:
          "Ориентировъчно превалутиране; няма посочен момент на конвертиране.",
        ariaLabel: "Данни за внос и доставка",
        dealer: "Дилър",
        destinationDelivery: "Доставка до дестинацията",
        documentCount: (count: number) =>
          `${count} ${count === 1 ? "документ" : "документа"} посочени`,
        documentation: "Документи",
        documentationDetail: `Броят е предоставен от източника на наличността и не означава, че ${leadSite.name} е прегледал всеки документ.`,
        freshnessEnds: (date: string) =>
          `Периодът на актуалност изтича на ${date}.`,
        heading: "Данни за автомобила, продавача и доставката",
        intro:
          "Местоположението на автомобила и продавача се показват отделно. Цената и доставката отразяват предоставения запис за наличност.",
        landedCost: "Крайна цена с доставка",
        landedCostPrefix: "Крайна цена с доставка: ",
        lastConfirmed: "Последно потвърждение",
        nativePrice: "Първоначално обявена цена",
        noFreshnessDeadline: "Не е посочен краен срок на актуалност.",
        noFreshnessRecord: "Няма приложен запис за актуалност от фийд.",
        notSupplied: "Няма данни",
        physicalLocation: "Физическо местоположение на обявения автомобил.",
        privateSeller: "Частен продавач",
        publicTruth: "Проверими данни за обявата",
        sellerLocation: "Местоположение на продавача",
        source: "Източник",
        vehicleLocation: "Местоположение на автомобила",
        verifiedImporter: "Проверен вносител",
        verifiedImporterDetail:
          "— типът организация, KYB проверката и статусът на доверие на доставчика са потвърдени. Това не е проверка на самия автомобил.",
      }
    : {
        advertisedPrice: "Advertised price",
        approximateConversion: "Approx. conversion",
        approximateConversionAt: (date: string) =>
          `Approximate currency conversion at ${date}. It is not the native asking price.`,
        approximateConversionWithoutDate:
          "Approximate currency conversion; conversion time was not supplied.",
        ariaLabel: "Import and supply details",
        dealer: "Dealer",
        destinationDelivery: "Destination delivery",
        documentCount: (count: number) =>
          `${count} document${count === 1 ? "" : "s"} listed`,
        documentation: "Documentation",
        documentationDetail: `Document count supplied by the inventory source; it does not mean ${leadSite.name} reviewed each document.`,
        freshnessEnds: (date: string) => `Freshness window ends ${date}.`,
        heading: "Vehicle, seller and supply details",
        intro:
          "Vehicle location and seller location are shown separately. Price and delivery labels reflect the supplied inventory record.",
        landedCost: "Landed cost",
        landedCostPrefix: "Landed cost: ",
        lastConfirmed: "Last confirmed",
        nativePrice: "Native asking price",
        noFreshnessDeadline: "No freshness deadline was supplied.",
        noFreshnessRecord: "No live-feed freshness record is attached.",
        notSupplied: "Not supplied",
        physicalLocation: "Physical location of the advertised vehicle.",
        privateSeller: "Private seller",
        publicTruth: "Public listing truth",
        sellerLocation: "Seller location",
        source: "Source",
        vehicleLocation: "Vehicle location",
        verifiedImporter: "Verified importer",
        verifiedImporterDetail:
          "— supplier organization type, KYB, and supplier trust status are verified. This does not verify the vehicle itself.",
      };
};

interface TruthRowProps {
  readonly compact?: boolean;
  readonly detail?: string;
  readonly icon: ComponentType<{
    "aria-hidden"?: boolean;
    className?: string;
  }>;
  readonly label: string;
  readonly value: string;
}

const TruthRow = ({
  compact = false,
  detail,
  icon: Icon,
  label,
  value,
}: TruthRowProps) => (
  <div className="grid gap-1 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
    <dt className="flex items-center gap-2 text-muted-foreground text-xs">
      <Icon aria-hidden={true} className="size-4 shrink-0" />
      {label}
    </dt>
    <dd>
      <p className="font-medium text-sm">{value}</p>
      {detail && !compact ? (
        <p className="mt-1 text-muted-foreground text-xs leading-5">{detail}</p>
      ) : null}
    </dd>
  </div>
);

export const ListingPublicTruth = ({
  compact = false,
  listing,
  locale,
}: ListingPublicTruthProps) => {
  const supply = listing.supply;
  const physicalLocation = getPhysicalVehicleLocation(listing);
  const primaryPrice = getPrimaryListingPrice(listing);
  const approximatePrice = getApproximateConvertedPrice(listing);
  const deliveryTruth = getDeliveryTruth(listing, locale);
  const landedCostTruth = getLandedCostTruth(listing, locale);
  const convertedAt = formatTruthDateTime(
    supply?.priceConversion.convertedAt,
    locale
  );
  const lastConfirmedAt = formatTruthDateTime(
    supply?.provenance.lastConfirmedAt,
    locale
  );
  const copy = getTruthCopy(locale);

  return (
    <section
      aria-label={compact ? copy.ariaLabel : undefined}
      aria-labelledby={compact ? undefined : "public-truth-heading"}
    >
      {compact ? null : (
        <>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {copy.publicTruth}
          </p>
          <h2 className="mt-1 font-semibold text-lg" id="public-truth-heading">
            {copy.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
            {copy.intro}
          </p>
        </>
      )}

      <dl className="mt-4 space-y-1">
        <TruthRow
          compact={compact}
          detail={copy.physicalLocation}
          icon={MapPin}
          label={copy.vehicleLocation}
          value={formatVehicleLocation(physicalLocation, locale)}
        />
        <TruthRow
          compact={compact}
          detail={`${listing.seller.displayName} · ${
            listing.seller.type === "dealer" ? copy.dealer : copy.privateSeller
          }`}
          icon={Building2}
          label={copy.sellerLocation}
          value={formatVehicleLocation(
            { city: listing.seller.city, country: "" },
            locale
          )}
        />
        <TruthRow
          compact={compact}
          detail={formatPriceType(listing.priceType, locale)}
          icon={WalletCards}
          label={supply ? copy.nativePrice : copy.advertisedPrice}
          value={formatMoney(primaryPrice, locale)}
        />
        {approximatePrice ? (
          <TruthRow
            compact={compact}
            detail={
              convertedAt
                ? copy.approximateConversionAt(convertedAt)
                : copy.approximateConversionWithoutDate
            }
            icon={Clock3}
            label={copy.approximateConversion}
            value={`≈ ${formatMoney(approximatePrice, locale)}`}
          />
        ) : null}
        {deliveryTruth ? (
          <TruthRow
            compact={compact}
            detail={deliveryTruth.detail}
            icon={Truck}
            label={copy.destinationDelivery}
            value={deliveryTruth.label}
          />
        ) : null}
        {landedCostTruth ? (
          <TruthRow
            compact={compact}
            detail={landedCostTruth.detail}
            icon={WalletCards}
            label={copy.landedCost}
            value={landedCostTruth.label.replace(copy.landedCostPrefix, "")}
          />
        ) : null}
        {supply ? (
          <TruthRow
            compact={compact}
            detail={copy.documentationDetail}
            icon={FileText}
            label={copy.documentation}
            value={copy.documentCount(supply.documentCount)}
          />
        ) : null}
        <TruthRow
          compact={compact}
          detail={
            supply ? getFreshnessLabel(listing, locale) : copy.noFreshnessRecord
          }
          icon={Clock3}
          label={copy.source}
          value={getSourceLabel(listing, locale)}
        />
        {supply ? (
          <TruthRow
            compact={compact}
            detail={
              supply.provenance.freshUntil
                ? copy.freshnessEnds(
                    formatTruthDateTime(supply.provenance.freshUntil, locale) ??
                      copy.notSupplied
                  )
                : copy.noFreshnessDeadline
            }
            icon={Clock3}
            label={copy.lastConfirmed}
            value={lastConfirmedAt ?? copy.notSupplied}
          />
        ) : null}
      </dl>

      {isVerifiedImporter(listing) ? (
        <p className="mt-4 flex items-start gap-2 text-sm">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-semibold">{copy.verifiedImporter}</strong>
            <span className="text-muted-foreground">
              {" "}
              {copy.verifiedImporterDetail}
            </span>
          </span>
        </p>
      ) : null}
    </section>
  );
};
