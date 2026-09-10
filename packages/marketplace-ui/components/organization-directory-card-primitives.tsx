import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CarFront,
  CheckCircle2,
  Clock3,
  Factory,
  Handshake,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShieldQuestion,
  Ship,
  Store,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getOrganizationInitials } from "../lib/organization-directory-card-policy";
import type {
  OrganizationDirectoryAction,
  OrganizationDirectoryCardData,
  OrganizationDirectoryCardLabels,
  OrganizationDirectoryInventorySummary,
  OrganizationDirectoryPreviewImage,
  OrganizationDirectoryProfileKind,
  OrganizationDirectorySignal,
  OrganizationDirectoryTradeLane,
} from "../lib/organization-directory-card-types";

const signalAppearance = {
  business_verified: {
    Icon: ShieldCheck,
    className: "border-success/15 bg-success-surface text-success-foreground",
  },
  claimed: {
    Icon: CheckCircle2,
    className: "border-border bg-card text-muted-foreground lg:bg-control",
  },
  commercial_partner: {
    Icon: Handshake,
    className: "border-border bg-control text-foreground/75",
  },
  inventory_current: {
    Icon: Clock3,
    className: "border-border bg-card text-muted-foreground lg:bg-control",
  },
  official_authorization: {
    Icon: BadgeCheck,
    className: "border-info/15 bg-info-surface text-info-foreground",
  },
  trusted_supplier: {
    Icon: PackageCheck,
    className: "border-success/15 bg-success-surface text-success-foreground",
  },
  unverified: {
    Icon: ShieldQuestion,
    className: "border-border bg-control text-muted-foreground",
  },
} as const;

const organizationTypeAppearance = {
  dealer: {
    Icon: Store,
    badgeClassName: "bg-control-hover text-foreground",
    iconClassName: "text-foreground/75",
  },
  distributor: {
    Icon: Boxes,
    badgeClassName: "bg-control-hover text-foreground",
    iconClassName: "text-foreground",
  },
  importer: {
    Icon: Ship,
    badgeClassName: "bg-control-hover text-foreground",
    iconClassName: "text-[var(--lead-site-accent)]",
  },
  manufacturer: {
    Icon: Factory,
    badgeClassName: "bg-control-hover text-foreground",
    iconClassName: "text-foreground",
  },
  private_seller: {
    Icon: UserRound,
    badgeClassName: "bg-control-hover text-foreground",
    iconClassName: "text-muted-foreground",
  },
} as const;

const fallbackOrganizationTypeAppearance = {
  Icon: Building2,
  badgeClassName: "bg-control-hover text-foreground",
  iconClassName: "text-foreground/75",
};

export const OrganizationLogo = ({
  alt,
  artwork = false,
  compactDesktop,
  name,
  url,
}: {
  alt?: string;
  artwork?: boolean;
  compactDesktop?: boolean;
  name: string;
  url?: string;
}) => (
  <div
    className={cn(
      "relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-control font-semibold text-foreground text-sm lg:border-0",
      compactDesktop && "lg:size-11"
    )}
  >
    {url ? (
      <Image
        alt={alt ?? name}
        className={artwork ? "object-cover" : "object-contain p-1.5"}
        fill
        sizes="56px"
        src={url}
        unoptimized={!url.startsWith("/")}
      />
    ) : (
      <span aria-hidden="true">{getOrganizationInitials(name)}</span>
    )}
  </div>
);

export const OrganizationSignalList = ({
  compactDesktop,
  label,
  signals,
}: {
  compactDesktop?: boolean;
  label: string;
  signals: readonly OrganizationDirectorySignal[];
}) => {
  if (signals.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={label}
      className={cn(
        "flex min-w-0 max-w-full flex-wrap gap-1.5",
        compactDesktop && "lg:[&>li:nth-child(n+3)]:hidden"
      )}
    >
      {signals.map((signal) => {
        const { Icon, className } = signalAppearance[signal.kind];
        return (
          <li
            className="min-w-0 max-w-full"
            key={`${signal.kind}-${signal.label}`}
          >
            <Badge
              className={cn(
                "h-6 max-w-full rounded-md px-1.5 font-medium text-xs lg:border-0",
                className
              )}
              variant="outline"
            >
              <Icon aria-hidden="true" className="shrink-0" />
              <span className="truncate">{signal.label}</span>
            </Badge>
          </li>
        );
      })}
    </ul>
  );
};

export const OrganizationProfileSignalMark = ({
  label,
  signal,
}: {
  label: string;
  signal?: OrganizationDirectorySignal;
}) => {
  if (!signal) {
    return null;
  }

  const { Icon, className } = signalAppearance[signal.kind];
  return (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-md border",
        className
      )}
      title={signal.label}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      <span className="sr-only">
        {label}: {signal.label}
      </span>
    </span>
  );
};

export const OrganizationTypeBadge = ({
  compact = false,
  inventory,
  kind,
  label,
}: {
  compact?: boolean;
  inventory?: OrganizationDirectoryInventorySummary;
  kind?: OrganizationDirectoryProfileKind;
  label: string;
}) => {
  const { Icon, badgeClassName, iconClassName } = kind
    ? organizationTypeAppearance[kind]
    : fallbackOrganizationTypeAppearance;

  return (
    <Badge
      className={cn(
        "min-w-0 max-w-full shrink-0 gap-1 overflow-hidden rounded-md border-0 px-1.5 text-xs",
        compact ? "h-6 font-medium" : "h-7 font-semibold",
        badgeClassName
      )}
      data-kind={kind ?? "organization"}
      data-slot="organization-type"
      variant="outline"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5 shrink-0", iconClassName)}
      />
      <span className="truncate">{label}</span>
      {inventory ? (
        <>
          <span
            aria-hidden="true"
            className="h-3 w-px shrink-0 bg-foreground/15"
          />
          <span
            className="flex min-w-0 items-baseline gap-1 whitespace-nowrap"
            data-slot="organization-inventory"
          >
            <span className="font-semibold text-foreground tabular-nums">
              {inventory.total}
            </span>
            <span className="truncate font-medium text-foreground/65">
              {inventory.totalLabel}
            </span>
          </span>
        </>
      ) : null}
    </Badge>
  );
};

const CompactInventoryContent = ({
  inventory,
}: {
  inventory: OrganizationDirectoryInventorySummary;
}) => (
  <>
    <p className="flex shrink-0 items-baseline gap-1.5">
      <span className="font-semibold text-foreground text-lg tabular-nums">
        {inventory.total}
      </span>
      <span className="text-muted-foreground text-xs">
        {inventory.totalLabel}
      </span>
    </p>
    {inventory.statuses?.length ? (
      <dl className="ml-auto flex min-w-0 items-center justify-end gap-3 overflow-hidden">
        {inventory.statuses.slice(0, 3).map((status) => (
          <div className="flex min-w-0 items-baseline gap-1" key={status.id}>
            <dd className="font-semibold text-foreground text-xs tabular-nums">
              {status.count}
            </dd>
            <dt className="truncate text-micro text-muted-foreground">
              {status.label}
            </dt>
          </div>
        ))}
      </dl>
    ) : null}
  </>
);

export const CompactOrganizationInventory = ({
  action,
  inventory,
}: {
  action?: OrganizationDirectoryAction;
  inventory: OrganizationDirectoryInventorySummary;
}) => {
  const className =
    "hidden min-h-11 items-center gap-3 rounded-lg bg-control/65 px-3 py-2 lg:flex";

  return action ? (
    <Link
      aria-label={action.label}
      className={cn(className, "transition-colors hover:bg-control-hover")}
      href={action.href}
    >
      <CompactInventoryContent inventory={inventory} />
    </Link>
  ) : (
    <div className={className}>
      <CompactInventoryContent inventory={inventory} />
    </div>
  );
};

export const OrganizationScopeBadge = ({
  locationLabel,
  toLabel,
  tradeLane,
}: {
  locationLabel?: string;
  toLabel: string;
  tradeLane?: OrganizationDirectoryTradeLane;
}) => {
  if (!(tradeLane || locationLabel)) {
    return null;
  }

  return (
    <Badge
      className="hidden h-7 w-fit max-w-full rounded-md border-0 bg-control-hover px-2 font-semibold text-foreground text-xs lg:inline-flex"
      variant="outline"
    >
      {tradeLane ? (
        <>
          <Ship aria-hidden="true" className="size-3.5" />
          <span className="truncate">{tradeLane.originLabel}</span>
          <ArrowRight aria-label={toLabel} className="size-3.5 shrink-0" />
          <span className="truncate">{tradeLane.destinationLabel}</span>
        </>
      ) : (
        <>
          <MapPin aria-hidden="true" className="size-3.5" />
          <span className="truncate">{locationLabel}</span>
        </>
      )}
    </Badge>
  );
};

export const OrganizationInventory = ({
  inventory,
}: {
  inventory: OrganizationDirectoryInventorySummary;
}) => (
  <div className="rounded-lg bg-control/65 px-3 py-2.5">
    <div className="flex items-end justify-between gap-3">
      <p className="flex items-baseline gap-1.5">
        <span className="font-semibold text-foreground text-xl tabular-nums">
          {inventory.total}
        </span>
        <span className="text-muted-foreground text-xs">
          {inventory.totalLabel}
        </span>
      </p>
      {inventory.updatedLabel ? (
        <p className="flex items-center gap-1 text-micro text-muted-foreground">
          <Clock3 aria-hidden="true" className="size-3" />
          {inventory.updatedLabel}
        </p>
      ) : null}
    </div>
    {inventory.statuses?.length ? (
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-border/70 border-t pt-2 lg:grid-cols-2 lg:border-t-0 lg:pt-0 xl:grid-cols-4 min-[390px]:grid-cols-4">
        {inventory.statuses.slice(0, 4).map((status) => (
          <div className="flex min-w-0 items-baseline gap-1" key={status.id}>
            <dt className="order-2 truncate text-micro text-muted-foreground">
              {status.label}
            </dt>
            <dd className="order-1 font-semibold text-foreground text-xs tabular-nums">
              {status.count}
            </dd>
          </div>
        ))}
      </dl>
    ) : null}
  </div>
);

export const OrganizationPreviewStrip = ({
  label,
  images,
  priority,
}: {
  label: string;
  images: readonly OrganizationDirectoryPreviewImage[];
  priority: boolean;
}) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <figure className="grid h-20 grid-cols-3 gap-1 overflow-hidden bg-control">
      <figcaption className="sr-only">{label}</figcaption>
      {images.slice(0, 3).map((image, index) => (
        <div className="relative overflow-hidden" key={image.id}>
          <Image
            alt={image.alt}
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            fill
            loading={priority && index === 0 ? "eager" : "lazy"}
            referrerPolicy="no-referrer"
            sizes="(max-width: 767px) 33vw, (max-width: 1279px) 16vw, 11vw"
            src={image.src}
          />
        </div>
      ))}
    </figure>
  );
};

export const OrganizationCardActions = ({
  compactDesktop,
  inventoryAction,
  profileAction,
}: {
  compactDesktop: boolean;
  inventoryAction?: OrganizationDirectoryAction;
  profileAction: OrganizationDirectoryAction;
}) => (
  <>
    <div
      className={cn(
        "mt-auto flex items-center gap-2 border-border border-t pt-3 lg:border-t-0 lg:pt-0",
        compactDesktop && "lg:hidden"
      )}
    >
      {inventoryAction ? (
        <Button asChild className="min-w-0 flex-1" size="sm">
          <Link href={inventoryAction.href} prefetch={false}>
            <span className="truncate">{inventoryAction.label}</span>
          </Link>
        </Button>
      ) : null}
      <Button
        asChild
        className={cn(
          "min-w-0",
          inventoryAction
            ? "flex-1 lg:border-0 lg:bg-control lg:hover:bg-control-hover"
            : "w-full"
        )}
        size="sm"
        variant={inventoryAction ? "outline" : "default"}
      >
        <Link href={profileAction.href} prefetch={false}>
          <span className="truncate">{profileAction.label}</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
    {compactDesktop ? (
      <div className="mt-auto hidden items-center justify-end lg:flex">
        <Link
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-semibold text-sm hover:bg-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={profileAction.href}
          prefetch={false}
        >
          <span className="truncate">{profileAction.label}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    ) : null}
  </>
);

export const OrganizationBrandList = ({
  brands,
  labels,
  limit = 4,
}: {
  brands: readonly string[];
  labels: OrganizationDirectoryCardLabels;
  limit?: number;
}) => {
  if (brands.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      <span className="shrink-0 text-micro text-muted-foreground uppercase tracking-wide">
        {labels.brands}
      </span>
      <ul className="flex min-w-0 gap-1.5 overflow-hidden">
        {brands.slice(0, limit).map((brand) => (
          <li
            className="truncate rounded-md bg-control px-2 py-1 font-medium text-foreground/80 text-micro"
            key={brand}
          >
            {brand}
          </li>
        ))}
      </ul>
      {brands.length > limit ? (
        <span className="shrink-0 text-micro text-muted-foreground">
          <span aria-hidden="true">+{brands.length - limit}</span>
          <span className="sr-only">
            {brands.length - limit} {labels.additionalBrands}
          </span>
        </span>
      ) : null}
    </div>
  );
};

export const DesktopOrganizationProfileImage = ({
  organization,
  prominent = false,
}: {
  organization: OrganizationDirectoryCardData;
  prominent?: boolean;
}) => {
  const imageUrl =
    organization.profileImage?.src ??
    organization.logoUrl ??
    organization.defaultAvatar?.src;
  const imageAlt =
    organization.profileImage?.alt ??
    organization.logoAlt ??
    organization.defaultAvatar?.alt ??
    organization.name;
  const isProfileArtwork = Boolean(
    organization.profileImage || organization.defaultAvatar
  );
  const imageClassName = isProfileArtwork
    ? "object-cover"
    : cn("object-contain", prominent ? "p-2.5" : "p-2");

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-control shadow-xs ring-1 ring-border/80",
        prominent ? "size-20" : "size-16"
      )}
      data-slot="organization-profile-image"
    >
      {imageUrl ? (
        <Image
          alt={imageAlt}
          className={imageClassName}
          fill
          sizes={prominent ? "80px" : "64px"}
          src={imageUrl}
          unoptimized={!imageUrl.startsWith("/")}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-full place-items-center font-semibold text-foreground",
            prominent ? "text-xl" : "text-lg"
          )}
        >
          {getOrganizationInitials(organization.name)}
        </span>
      )}
    </div>
  );
};

const organizationListingPreviewSlots = ["first", "second", "third"] as const;

export const OrganizationListingPreviewBoxes = ({
  emptyLabel,
  images,
  label,
  priority,
  reserveSlots = false,
}: {
  emptyLabel: string;
  images: readonly OrganizationDirectoryPreviewImage[];
  label: string;
  priority: boolean;
  reserveSlots?: boolean;
}) => {
  const visibleImages = images.slice(0, 3);
  if (!(reserveSlots || visibleImages.length > 0)) {
    return null;
  }

  return (
    <figure className="mt-3" data-slot="organization-listing-previews">
      <figcaption className="sr-only">{label}</figcaption>
      <div
        className="grid grid-cols-3 gap-1.5"
        data-preview-count={visibleImages.length}
        data-preview-slot-count="3"
      >
        {organizationListingPreviewSlots.map((slot, index) => {
          const image = visibleImages[index];
          if (!image) {
            return (
              <div
                className="flex h-[4.5rem] flex-col items-center justify-center gap-1 overflow-hidden rounded-lg bg-control/70 px-1 text-muted-foreground/60 ring-1 ring-border/50"
                data-slot="organization-listing-preview-empty"
                key={slot}
              >
                <CarFront
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.5}
                />
                <span className="max-w-full truncate font-medium text-micro">
                  {emptyLabel}
                </span>
              </div>
            );
          }

          const content = (
            <>
              <Image
                alt={image.alt}
                className="object-cover transition-transform duration-200 group-hover/preview:scale-[1.03]"
                fill
                loading={priority && index === 0 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                sizes="(max-width: 1023px) 30vw, 96px"
                src={image.src}
              />
              {image.priceLabel ? (
                <span className="absolute bottom-1 left-1 max-w-[calc(100%-0.5rem)] truncate rounded-md bg-card/95 px-1.5 py-0.5 font-semibold text-foreground text-micro shadow-sm ring-1 ring-border/40">
                  {image.priceLabel}
                </span>
              ) : null}
            </>
          );
          const className =
            "group/preview relative z-10 block h-[4.5rem] overflow-hidden rounded-lg bg-control ring-1 ring-border/60 transition-[box-shadow] hover:ring-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

          return image.href ? (
            <Link
              aria-label={image.title ?? image.alt}
              className={className}
              href={image.href}
              key={image.id}
              prefetch={false}
            >
              {content}
            </Link>
          ) : (
            <div className={className} key={image.id}>
              {content}
            </div>
          );
        })}
      </div>
    </figure>
  );
};

export const DesktopOrganizationInventoryLine = ({
  inventory,
}: {
  inventory?: OrganizationDirectoryInventorySummary;
}) => {
  if (!inventory) {
    return null;
  }

  return (
    <div
      className="flex min-h-14 min-w-0 items-center gap-3 rounded-lg bg-control/75 px-3 py-2.5"
      data-slot="organization-inventory"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-card text-muted-foreground shadow-sm">
        <CarFront aria-hidden="true" className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-semibold text-foreground text-lg tabular-nums leading-none">
            {inventory.total}
          </span>
          <span className="text-foreground/70 text-xs">
            {inventory.totalLabel}
          </span>
        </p>
        {inventory.statuses?.slice(0, 1).map((status) => (
          <p
            className="mt-1 truncate font-medium text-muted-foreground text-xs"
            key={status.id}
          >
            {status.count} {status.label}
          </p>
        ))}
      </div>
      {inventory.updatedLabel ? (
        <p className="ml-auto hidden shrink-0 items-center gap-1 text-micro text-muted-foreground min-[85rem]:flex">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {inventory.updatedLabel}
        </p>
      ) : null}
    </div>
  );
};

export const DesktopOrganizationInventoryAction = ({
  emptyLabel,
  organization,
}: {
  emptyLabel: string;
  organization: OrganizationDirectoryCardData;
}) => {
  const inventory = organization.inventory;
  if (!inventory) {
    return null;
  }
  if (!organization.inventoryAction) {
    return (
      <div
        aria-disabled="true"
        className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-control/55 px-3 text-muted-foreground text-sm"
        data-slot="organization-inventory"
      >
        <CarFront aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{emptyLabel}</span>
      </div>
    );
  }

  return (
    <Link
      aria-label={`${organization.inventoryAction.label}: ${organization.name} (${inventory.total} ${inventory.totalLabel})`}
      className="relative z-10 flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-control/75 px-2.5 font-semibold text-sm transition-colors hover:bg-control-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={organization.inventoryAction.href}
      prefetch={false}
    >
      <span className="truncate">{organization.inventoryAction.label}</span>
      <span className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-xs tabular-nums ring-1 ring-border/60">
        {inventory.total}
      </span>
      <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  );
};
