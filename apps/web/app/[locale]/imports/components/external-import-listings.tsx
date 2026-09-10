import { Badge } from "@repo/design-system/components/ui/badge";
import {
  type ExternalInventoryDiscoveryListing,
  type ExternalInventoryDiscoveryResponse,
  formatFuelType,
  formatMileage,
  formatMoney,
  formatTransmission,
} from "@repo/marketplace";
import {
  CarFront,
  ExternalLink,
  MapPin,
  ShieldAlert,
  Ship,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { BlankImportRequestLink } from "./blank-import-request-link";

interface ExternalImportListingsProps {
  data: readonly ExternalInventoryDiscoveryResponse[];
  headingId: string;
  importsPath: string;
  locale: "bg" | "en";
  selectedOrigin: string;
  showRequestAction?: boolean;
}

type AvailableExternalInventory = Extract<
  ExternalInventoryDiscoveryResponse,
  { status: "ok" }
>;

const getUnavailableCopy = (
  data: Exclude<ExternalInventoryDiscoveryResponse, { status: "ok" }> | null,
  isBg: boolean
) => {
  if (data?.status === "disabled" && data.reason === "unsupported_origin") {
    return isBg
      ? "Все още няма свързани обяви за тази държава."
      : "There are no connected listings for this country yet.";
  }
  if (data?.status === "disabled") {
    return isBg
      ? "Внос по ваша заявка"
      : "Import a vehicle of your choice";
  }
  return isBg
    ? "Обявите временно не се зареждат."
    : "Listings are temporarily unavailable.";
};

const buildImportRequestHref = (
  importsPath: string,
  origin: string,
  sourceUrl: string
) => {
  const params = new URLSearchParams({ origin, sourceUrl });
  return `${importsPath}?${params.toString()}#import-request`;
};

const buildBlankImportRequestHref = (
  importsPath: string,
  selectedOrigin: string
) => {
  const params = new URLSearchParams({ start: "1" });

  if (selectedOrigin !== "ALL") {
    params.set("origin", selectedOrigin);
  }

  return `${importsPath}?${params.toString()}#import-request`;
};

const getDisplayTitle = (listing: ExternalInventoryDiscoveryListing) =>
  listing.title.replace(new RegExp(`^${listing.vehicle.year}\\s+`), "");

const getFormattedPrice = (
  listing: ExternalInventoryDiscoveryListing,
  locale: "bg" | "en"
) =>
  formatMoney(
    {
      amount:
        Number(listing.offer.nativePrice.amountMinor) /
        10 ** listing.offer.nativePrice.exponent,
      currency: listing.offer.nativePrice.currencyCode,
    },
    locale
  );

const getLocationLabel = (listing: ExternalInventoryDiscoveryListing) =>
  [
    listing.offer.dealerName,
    listing.offer.physicalLocation.city,
    listing.offer.physicalLocation.region ??
      listing.offer.physicalLocation.country,
  ]
    .filter(Boolean)
    .join(" · ");

const getCompactTransmissionLabel = (
  transmission: ExternalInventoryDiscoveryListing["vehicle"]["transmission"],
  locale: "bg" | "en"
) => {
  if (locale !== "bg") {
    return formatTransmission(transmission, locale);
  }

  const labels = {
    automatic: "Автоматик",
    manual: "Ръчни",
    semi_automatic: "Полуавтоматик",
  } as const;
  return labels[transmission];
};

const ExternalInventoryCard = ({
  importsPath,
  isBg,
  listing,
  locale,
}: {
  importsPath: string;
  isBg: boolean;
  listing: ExternalInventoryDiscoveryListing;
  locale: "bg" | "en";
}) => {
  const displayTitle = getDisplayTitle(listing);
  const sourceLabel = isBg
    ? `Отвори обявата за ${displayTitle} при източника`
    : `Open the source listing for ${displayTitle}`;
  const facts = [
    String(listing.vehicle.year),
    formatMileage(listing.offer.mileageKm, locale),
    formatFuelType(listing.vehicle.fuelType, locale),
    getCompactTransmissionLabel(listing.vehicle.transmission, locale),
  ];

  return (
    <article
      className="grid min-h-44 grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-xl bg-card lg:flex lg:min-h-0 lg:flex-col lg:rounded-lg lg:border lg:border-border"
      data-slot="external-inventory-card"
    >
      <a
        aria-label={sourceLabel}
        className="relative grid min-h-44 place-items-center overflow-hidden bg-zinc-100 text-zinc-400 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:aspect-[16/10] lg:min-h-0 lg:w-full"
        data-slot="external-inventory-media-link"
        href={listing.source.listingUrl}
        rel="nofollow sponsored noopener noreferrer"
        target="_blank"
      >
        <CarFront aria-hidden="true" className="size-10 lg:size-12" />
        <span className="absolute right-2 bottom-2 left-2 text-center font-medium text-[10px] text-zinc-500 leading-3">
          {isBg ? "Снимки при източника" : "Photos at source"}
        </span>
        <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/95 text-zinc-700 shadow-sm">
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </span>
      </a>

      <div
        className="flex min-w-0 flex-col p-3 lg:p-3.5"
        data-slot="external-inventory-content"
      >
        <h3 className="line-clamp-2 font-semibold text-base text-foreground leading-5 tracking-tight">
          {displayTitle}
        </h3>
        <p className="mt-1 break-words font-bold text-lg tabular-nums leading-5 tracking-tight">
          {getFormattedPrice(listing, locale)}
        </p>

        <ul
          aria-label={isBg ? "Основни характеристики" : "Key specifications"}
          className="mt-2 grid grid-cols-2 gap-1"
        >
          {facts.map((fact) => (
            <li className="min-w-0" key={fact}>
              <Badge
                className="h-6 w-full justify-start truncate rounded-md border-0 bg-zinc-100 px-2 font-medium text-[11px] text-zinc-700 tabular-nums"
                title={fact}
                variant="secondary"
              >
                {fact}
              </Badge>
            </li>
          ))}
        </ul>

        <p
          className="mt-2 flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground leading-4"
          title={getLocationLabel(listing)}
        >
          <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{getLocationLabel(listing)}</span>
        </p>

        <div
          className="mt-auto grid grid-cols-1 gap-2 pt-2 min-[360px]:grid-cols-2"
          data-slot="external-inventory-action-row"
        >
          <a
            className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2 font-semibold text-xs outline-none transition-colors hover:bg-control-hover focus-visible:ring-[3px] focus-visible:ring-ring/35 lg:h-9"
            data-slot="external-inventory-source-action"
            href={listing.source.listingUrl}
            rel="nofollow sponsored noopener noreferrer"
            target="_blank"
          >
            {isBg ? "Източник" : "Source"}
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
          <Link
            className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-md bg-[var(--lead-site-accent)] px-2 font-semibold text-white text-xs outline-none transition-colors hover:bg-[var(--lead-site-accent-hover)] focus-visible:ring-[3px] focus-visible:ring-[var(--lead-site-accent-ring)] lg:h-9"
            data-slot="external-inventory-import-action"
            href={buildImportRequestHref(
              importsPath,
              listing.offer.physicalLocation.countryCode,
              listing.source.listingUrl
            )}
          >
            <span className="sm:hidden">{isBg ? "Внос" : "Import"}</span>
            <span className="hidden sm:inline">
              {isBg ? "Поискай внос" : "Request import"}
            </span>
            <Ship aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export const ExternalImportListings = ({
  data,
  headingId,
  importsPath,
  locale,
  selectedOrigin,
  showRequestAction = true,
}: ExternalImportListingsProps) => {
  const isBg = locale === "bg";
  const blankRequestHref = buildBlankImportRequestHref(
    importsPath,
    selectedOrigin
  );
  const availableFeeds = data.filter(
    (feed): feed is AvailableExternalInventory => feed.status === "ok"
  );
  const listings = Array.from(
    new Map(
      availableFeeds
        .flatMap((feed) => feed.listings)
        .map((listing) => [
          `${listing.source.providerId}:${listing.externalId}`,
          listing,
        ])
    ).values()
  );

  if (availableFeeds.length === 0) {
    const unavailableFeed =
      data.find(
        (
          feed
        ): feed is Exclude<
          ExternalInventoryDiscoveryResponse,
          { status: "ok" }
        > => feed.status !== "ok"
      ) ?? null;

    const StateIcon = unavailableFeed?.status === "disabled" ? Ship : ShieldAlert;

    return (
      <div
        className="flex min-h-36 flex-col items-center justify-center overflow-hidden rounded-xl bg-card px-5 pb-6 text-center lg:min-h-44"
        data-provider-state={unavailableFeed?.status ?? "unavailable"}
      >
        {unavailableFeed?.status === "disabled" ? (
          <Image alt="" src="/images/services/import-banner-v2.png" width={1536} height={1024} sizes="(max-width: 1023px) 100vw, 640px" className="mb-4 h-44 w-[calc(100%+2.5rem)] max-w-none object-cover lg:h-64" />
        ) : <StateIcon
          aria-hidden="true"
          className="mt-6 size-5 text-muted-foreground"
        />}
        <h2 className="mt-2 font-semibold text-sm" id={headingId}>
          {getUnavailableCopy(unavailableFeed, isBg)}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-zinc-600 leading-5">
          {isBg
            ? "Поставете линк горе или опишете автомобила, който търсите."
            : "Paste a link above or describe the vehicle you want."}
        </p>
        {showRequestAction ? (
          <BlankImportRequestLink
            defaultOrigin={selectedOrigin}
            href={blankRequestHref}
            isBg={isBg}
          />
        ) : null}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div
        className="rounded-xl bg-secondary p-7 text-center text-muted-foreground text-sm lg:border lg:border-border lg:bg-card"
        data-provider-state="empty"
      >
        <h2 className="font-medium" id={headingId}>
          {isBg ? "Няма активни обяви" : "No active listings"}
        </h2>
        {showRequestAction ? (
          <BlankImportRequestLink
            defaultOrigin={selectedOrigin}
            href={blankRequestHref}
            isBg={isBg}
          />
        ) : null}
      </div>
    );
  }

  return (
    <>
      <h2 className="sr-only" id={headingId}>
        {isBg ? "Обяви за внос" : "Import listings"}
      </h2>

      <div
        className="grid items-start gap-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4"
        data-provider-state="ok"
        data-slot="external-inventory-grid"
      >
        {listings.map((listing) => (
          <ExternalInventoryCard
            importsPath={importsPath}
            isBg={isBg}
            key={`${listing.source.providerId}:${listing.externalId}`}
            listing={listing}
            locale={locale}
          />
        ))}
      </div>
    </>
  );
};
