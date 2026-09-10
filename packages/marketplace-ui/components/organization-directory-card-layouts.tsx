import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { ArrowRight, MapPin, Warehouse } from "lucide-react";
import Link from "next/link";
import { getFeaturedOrganizationSignals } from "../lib/organization-directory-card-policy";
import type {
  OrganizationDirectoryCardData,
  OrganizationDirectoryCardLabels,
  OrganizationDirectoryPreviewImage,
  OrganizationDirectorySignal,
  OrganizationDirectoryTradeLane,
} from "../lib/organization-directory-card-types";
import {
  CompactOrganizationInventory,
  DesktopOrganizationInventoryAction,
  DesktopOrganizationInventoryLine,
  DesktopOrganizationProfileImage,
  OrganizationBrandList,
  OrganizationCardActions,
  OrganizationInventory,
  OrganizationListingPreviewBoxes,
  OrganizationLogo,
  OrganizationPreviewStrip,
  OrganizationProfileSignalMark,
  OrganizationScopeBadge,
  OrganizationSignalList,
  OrganizationTypeBadge,
} from "./organization-directory-card-primitives";

interface OrganizationDirectoryLayoutProps {
  badges: readonly OrganizationDirectorySignal[];
  brands: readonly string[];
  labels: OrganizationDirectoryCardLabels;
  organization: OrganizationDirectoryCardData;
  previewImages: readonly OrganizationDirectoryPreviewImage[];
  priority: boolean;
  services: readonly string[];
  tradeLanes: readonly OrganizationDirectoryTradeLane[];
}

const OrganizationIdentityHeader = ({
  compactDesktop,
  labels,
  organization,
  primarySignal,
}: {
  compactDesktop: boolean;
  labels: OrganizationDirectoryCardLabels;
  organization: OrganizationDirectoryCardData;
  primarySignal?: OrganizationDirectorySignal;
}) => {
  const primarySignals = primarySignal ? [primarySignal] : [];

  return (
    <div
      className={cn(
        "flex min-w-0 gap-3 p-4 pb-3",
        compactDesktop && "lg:gap-2.5 lg:p-3 lg:pb-2"
      )}
    >
      <OrganizationLogo
        alt={organization.logoAlt ?? organization.defaultAvatar?.alt}
        artwork={!organization.logoUrl && Boolean(organization.defaultAvatar)}
        compactDesktop={compactDesktop}
        name={organization.name}
        url={organization.logoUrl ?? organization.defaultAvatar?.src}
      />
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 font-semibold text-card-title">
          <Link
            className="rounded-sm text-foreground hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={organization.profileAction.href}
            prefetch={false}
          >
            {organization.name}
          </Link>
        </h3>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
          <OrganizationTypeBadge
            kind={organization.typeKind}
            label={organization.typeLabel}
          />
          {organization.locationLabel ? (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="truncate text-meta text-muted-foreground">
                {organization.locationLabel}
              </span>
            </span>
          ) : null}
        </div>
      </div>
      {compactDesktop && primarySignal ? (
        <div className="hidden shrink-0 lg:block">
          <OrganizationSignalList
            label={labels.credentials}
            signals={primarySignals}
          />
        </div>
      ) : null}
    </div>
  );
};

const OrganizationTradeLaneDetails = ({
  compactDesktop,
  labels,
  tradeLanes,
}: {
  compactDesktop: boolean;
  labels: OrganizationDirectoryCardLabels;
  tradeLanes: readonly OrganizationDirectoryTradeLane[];
}) => {
  if (tradeLanes.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-1.5", compactDesktop && "lg:hidden")}>
      {tradeLanes.slice(0, 2).map((tradeLane) => (
        <p
          className="flex min-w-0 items-center gap-1.5 text-foreground/80 text-meta"
          key={tradeLane.id}
        >
          <span className="truncate font-medium">{tradeLane.originLabel}</span>
          <ArrowRight
            aria-label={labels.to}
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          <span className="truncate font-medium">
            {tradeLane.destinationLabel}
          </span>
          {tradeLane.detail ? (
            <span
              className={cn(
                "ml-auto hidden shrink-0 text-micro text-muted-foreground sm:inline lg:hidden xl:inline",
                compactDesktop && "lg:hidden xl:hidden"
              )}
            >
              {tradeLane.detail}
            </span>
          ) : null}
        </p>
      ))}
    </div>
  );
};

const OrganizationInventorySection = ({
  compactDesktop,
  inventory,
  inventoryAction,
}: {
  compactDesktop: boolean;
  inventory?: OrganizationDirectoryCardData["inventory"];
  inventoryAction?: OrganizationDirectoryCardData["inventoryAction"];
}) => {
  if (!inventory) {
    return null;
  }

  return (
    <>
      <div className={cn(compactDesktop && "lg:hidden")}>
        <OrganizationInventory inventory={inventory} />
      </div>
      {compactDesktop ? (
        <CompactOrganizationInventory
          action={inventoryAction}
          inventory={inventory}
        />
      ) : null}
    </>
  );
};

const OrganizationServiceList = ({
  compactDesktop,
  services,
}: {
  compactDesktop: boolean;
  services: readonly string[];
}) => {
  if (services.length === 0) {
    return null;
  }

  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs",
        compactDesktop && "lg:hidden"
      )}
    >
      <Warehouse aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="truncate">{services.slice(0, 3).join(" · ")}</span>
    </p>
  );
};

const OrganizationCardBody = ({
  badges,
  brands,
  compactDesktop,
  labels,
  organization,
  services,
  tradeLanes,
}: Omit<OrganizationDirectoryLayoutProps, "previewImages" | "priority"> & {
  compactDesktop: boolean;
}) => (
  <div
    className={cn(
      "flex flex-1 flex-col gap-3 p-4",
      compactDesktop && "lg:gap-1.5 lg:px-3 lg:pt-1 lg:pb-2.5"
    )}
  >
    <div className={cn(compactDesktop && "lg:hidden")}>
      <OrganizationSignalList
        compactDesktop={compactDesktop}
        label={labels.credentials}
        signals={badges}
      />
    </div>

    {compactDesktop ? (
      <OrganizationScopeBadge
        locationLabel={organization.locationLabel}
        toLabel={labels.to}
        tradeLane={tradeLanes[0]}
      />
    ) : null}

    {organization.description ? (
      <p
        className={cn(
          "line-clamp-2 text-muted-foreground text-sm leading-5",
          compactDesktop && "lg:hidden"
        )}
      >
        {organization.description}
      </p>
    ) : null}

    <OrganizationTradeLaneDetails
      compactDesktop={compactDesktop}
      labels={labels}
      tradeLanes={tradeLanes}
    />
    <OrganizationInventorySection
      compactDesktop={compactDesktop}
      inventory={organization.inventory}
      inventoryAction={organization.inventoryAction}
    />
    <OrganizationBrandList brands={brands} labels={labels} />
    <OrganizationServiceList
      compactDesktop={compactDesktop}
      services={services}
    />
    <OrganizationCardActions
      compactDesktop={compactDesktop}
      inventoryAction={organization.inventoryAction}
      profileAction={organization.profileAction}
    />
  </div>
);

const MobileOrganizationProfileCard = ({
  labels,
  organization,
  previewImages,
  priority,
  signals,
}: {
  labels: OrganizationDirectoryCardLabels;
  organization: OrganizationDirectoryCardData;
  previewImages: readonly OrganizationDirectoryPreviewImage[];
  priority: boolean;
  signals: readonly OrganizationDirectorySignal[];
}) => (
  <div className="flex min-h-36 flex-1 flex-col p-4 lg:hidden">
    <div className="flex min-w-0 gap-3">
      <DesktopOrganizationProfileImage organization={organization} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="min-w-0 flex-1 break-words font-semibold text-card-title">
            <Link
              className="rounded-sm text-foreground after:absolute after:inset-0 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={organization.profileAction.href}
              prefetch={false}
            >
              {organization.name}
            </Link>
          </h3>
          <OrganizationProfileSignalMark
            label={labels.credentials}
            signal={signals[0]}
          />
        </div>
        {organization.locationLabel ? (
          <p className="mt-1.5 flex min-w-0 items-center gap-1 text-meta text-muted-foreground">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{organization.locationLabel}</span>
          </p>
        ) : null}
        <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden">
          <OrganizationTypeBadge
            inventory={organization.inventory}
            kind={organization.typeKind}
            label={organization.typeLabel}
          />
        </div>
      </div>
    </div>

    <OrganizationListingPreviewBoxes
      emptyLabel={labels.emptyListingPreview}
      images={previewImages}
      label={labels.inventoryPreview}
      priority={priority}
    />

    <Link
      aria-label={`${organization.profileAction.label}: ${organization.name}`}
      className="relative z-10 mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-control px-3 font-semibold text-sm transition-colors hover:bg-control-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={organization.profileAction.href}
      prefetch={false}
    >
      <span className="truncate">{organization.profileAction.label}</span>
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  </div>
);

const DesktopOrganizationProfileCard = ({
  labels,
  organization,
  previewImages,
  priority,
  signals,
}: {
  labels: OrganizationDirectoryCardLabels;
  organization: OrganizationDirectoryCardData;
  previewImages: readonly OrganizationDirectoryPreviewImage[];
  priority: boolean;
  signals: readonly OrganizationDirectorySignal[];
}) => (
  <div className="hidden min-h-[15.75rem] flex-1 flex-col p-4 lg:flex">
    <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
      <DesktopOrganizationProfileImage organization={organization} />
      <div className="min-w-0 flex-1">
        <h3 className="min-w-0 font-semibold text-card-title">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                className="block truncate rounded-sm text-foreground after:absolute after:inset-0 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={organization.profileAction.href}
                prefetch={false}
              >
                {organization.name}
              </Link>
            </TooltipTrigger>
            <TooltipContent
              align="start"
              className="max-w-80 px-3 py-2 text-left"
              side="top"
              sideOffset={8}
            >
              <p className="font-semibold text-sm">{organization.name}</p>
              {organization.locationLabel ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs opacity-80">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                  <span>{organization.locationLabel}</span>
                </p>
              ) : null}
            </TooltipContent>
          </Tooltip>
        </h3>
        {organization.locationLabel ? (
          <p className="mt-1 flex min-w-0 items-center gap-1 text-foreground/60 text-xs">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{organization.locationLabel}</span>
          </p>
        ) : null}
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 overflow-hidden">
          <OrganizationTypeBadge
            compact
            kind={organization.typeKind}
            label={organization.typeLabel}
          />
          <div className="min-w-0 overflow-hidden">
            <OrganizationSignalList
              label={labels.credentials}
              signals={signals}
            />
          </div>
        </div>
      </div>
    </div>

    <OrganizationListingPreviewBoxes
      emptyLabel={labels.emptyListingPreview}
      images={previewImages}
      label={labels.inventoryPreview}
      priority={priority}
      reserveSlots
    />

    <div className="mt-auto flex min-w-0 items-center gap-2 pt-3">
      <DesktopOrganizationInventoryAction
        emptyLabel={labels.emptyInventory}
        organization={organization}
      />
      <Link
        aria-label={`${organization.profileAction.label}: ${organization.name}`}
        className="relative z-10 inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-control px-3 font-semibold text-sm transition-colors hover:bg-control-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={organization.profileAction.href}
        prefetch={false}
      >
        <span className="truncate">{organization.profileAction.label}</span>
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  </div>
);

const DesktopOrganizationListCard = ({
  brands,
  labels,
  organization,
  signals,
  services,
  tradeLanes,
}: Omit<OrganizationDirectoryLayoutProps, "badges" | "previewImages" | "priority"> & {
  signals: readonly OrganizationDirectorySignal[];
}) => (
  <div className="hidden min-h-32 grid-cols-[4rem_minmax(14rem,1.35fr)_minmax(12rem,0.9fr)_minmax(15rem,1fr)_auto] items-center gap-4 p-4 lg:grid">
    <DesktopOrganizationProfileImage organization={organization} />

    <div className="min-w-0">
      <h3 className="line-clamp-2 break-words font-semibold text-lg leading-5">
        <Link
          className="rounded-sm text-foreground after:absolute after:inset-0 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={organization.profileAction.href}
          prefetch={false}
        >
          {organization.name}
        </Link>
      </h3>
      <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden">
        <OrganizationTypeBadge
          kind={organization.typeKind}
          label={organization.typeLabel}
        />
        {organization.locationLabel ? (
          <span className="flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{organization.locationLabel}</span>
          </span>
        ) : null}
      </div>
      {organization.headline ? (
        <p className="mt-2 line-clamp-2 text-muted-foreground text-sm leading-5">
          {organization.headline}
        </p>
      ) : null}
    </div>

    <div className="min-w-0 space-y-2">
      {tradeLanes[0] ? (
        <OrganizationScopeBadge
          toLabel={labels.to}
          tradeLane={tradeLanes[0]}
        />
      ) : null}
      {signals.length ? (
        <OrganizationSignalList
          label={labels.credentials}
          signals={signals}
        />
      ) : null}
    </div>

    <div className="min-w-0 space-y-2">
      <DesktopOrganizationInventoryLine inventory={organization.inventory} />
      <OrganizationBrandList brands={brands} labels={labels} limit={4} />
      {services.length > 0 ? (
        <p className="flex min-w-0 items-center gap-1.5 text-muted-foreground text-xs">
          <Warehouse aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{services.slice(0, 3).join(" · ")}</span>
        </p>
      ) : null}
    </div>

    <Link
      aria-label={`${organization.profileAction.label}: ${organization.name}`}
      className="relative z-10 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-control px-3 font-semibold text-sm transition-colors hover:bg-control-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={organization.profileAction.href}
      prefetch={false}
    >
      <span>{organization.profileAction.label}</span>
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  </div>
);

const StandardOrganizationCardContent = ({
  badges,
  brands,
  labels,
  organization,
  previewImages,
  priority,
  services,
  tradeLanes,
}: OrganizationDirectoryLayoutProps) => (
  <>
    <OrganizationIdentityHeader
      compactDesktop={false}
      labels={labels}
      organization={organization}
    />
    {previewImages.length ? (
      <OrganizationPreviewStrip
        images={previewImages}
        label={labels.inventoryPreview}
        priority={priority}
      />
    ) : null}
    <OrganizationCardBody
      badges={badges}
      brands={brands}
      compactDesktop={false}
      labels={labels}
      organization={organization}
      services={services}
      tradeLanes={tradeLanes}
    />
  </>
);

export const OrganizationDirectoryCardLayouts = ({
  badges,
  brands,
  compactDesktop,
  desktopLayout,
  labels,
  organization,
  previewImages,
  priority,
  services,
  tradeLanes,
}: OrganizationDirectoryLayoutProps & {
  compactDesktop: boolean;
  desktopLayout?: "grid" | "list";
}) => {
  const trustSignals = getFeaturedOrganizationSignals(badges);
  const gridSignals = trustSignals.slice(0, 1);
  const listSignals = trustSignals.slice(0, 2);
  const hasResponsiveDesktopLayout = Boolean(compactDesktop || desktopLayout);

  if (!hasResponsiveDesktopLayout) {
    return (
      <StandardOrganizationCardContent
        badges={trustSignals}
        brands={brands}
        labels={labels}
        organization={organization}
        previewImages={previewImages}
        priority={priority}
        services={services}
        tradeLanes={tradeLanes}
      />
    );
  }

  return (
    <>
      <MobileOrganizationProfileCard
        labels={labels}
        organization={organization}
        previewImages={previewImages}
        priority={priority}
        signals={gridSignals}
      />
      {desktopLayout === "list" ? (
        <DesktopOrganizationListCard
          brands={brands}
          labels={labels}
          organization={organization}
          services={services}
          signals={listSignals}
          tradeLanes={tradeLanes}
        />
      ) : (
        <DesktopOrganizationProfileCard
          labels={labels}
          organization={organization}
          previewImages={previewImages}
          priority={priority}
          signals={gridSignals}
        />
      )}
    </>
  );
};
