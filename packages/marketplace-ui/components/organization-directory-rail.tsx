import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  ArrowRight,
  Building2,
  Clock3,
  MapPin,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type {
  OrganizationDirectoryAction,
  OrganizationDirectorySignalKind,
} from "./organization-directory-card";

export interface OrganizationDirectoryRailItem {
  href: string;
  id: string;
  inventoryLabel?: string;
  locationLabel?: string;
  logoAlt?: string;
  logoUrl?: string;
  name: string;
  signal?: {
    kind: Extract<
      OrganizationDirectorySignalKind,
      "business_verified" | "trusted_supplier" | "inventory_current"
    >;
    label: string;
  };
  tradeLaneLabel?: string;
  typeLabel: string;
}

export interface OrganizationDirectoryCorridorLink {
  href: string;
  id: string;
  label: string;
  meta?: string;
}

export interface OrganizationDirectoryRailProps {
  action: OrganizationDirectoryAction;
  className?: string;
  corridors?: readonly OrganizationDirectoryCorridorLink[];
  corridorsLabel?: string;
  description?: string;
  eyebrow?: string;
  items: readonly OrganizationDirectoryRailItem[];
  title: string;
}

const railSignalAppearance = {
  business_verified: {
    Icon: ShieldCheck,
    className: "border-success/15 bg-success-surface text-success-foreground",
  },
  inventory_current: {
    Icon: Clock3,
    className: "border-border bg-card text-muted-foreground",
  },
  trusted_supplier: {
    Icon: PackageCheck,
    className: "border-success/15 bg-success-surface text-success-foreground",
  },
} as const;

const RailLogo = ({ item }: { item: OrganizationDirectoryRailItem }) => (
  <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-control font-semibold text-foreground text-xs">
    {item.logoUrl ? (
      <Image
        alt={item.logoAlt ?? item.name}
        className="object-contain p-1"
        fill
        sizes="44px"
        src={item.logoUrl}
        unoptimized
      />
    ) : (
      <Building2 aria-hidden="true" className="size-5 text-muted-foreground" />
    )}
  </div>
);

const DirectoryRailItem = ({
  item,
}: {
  item: OrganizationDirectoryRailItem;
}) => {
  const signal = item.signal;
  const appearance = signal ? railSignalAppearance[signal.kind] : undefined;

  return (
    <li>
      <Link
        className="group/item flex min-h-24 min-w-0 gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href={item.href}
      >
        <RailLogo item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-sm">{item.name}</p>
              <p className="mt-0.5 truncate text-muted-foreground text-xs">
                {item.typeLabel}
              </p>
            </div>
            <ArrowRight
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover/item:translate-x-0.5"
            />
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-2 text-micro text-muted-foreground">
            {item.tradeLaneLabel ? (
              <span className="truncate font-medium text-foreground/75">
                {item.tradeLaneLabel}
              </span>
            ) : null}
            {item.locationLabel ? (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin aria-hidden="true" className="size-3 shrink-0" />
                <span className="truncate">{item.locationLabel}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-2">
            {item.inventoryLabel ? (
              <span className="truncate text-micro text-muted-foreground">
                {item.inventoryLabel}
              </span>
            ) : null}
            {signal && appearance ? (
              <Badge
                className={cn(
                  "ml-auto h-5 rounded-md px-1.5 text-micro",
                  appearance.className
                )}
                variant="outline"
              >
                <appearance.Icon aria-hidden="true" />
                {signal.label}
              </Badge>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
};

export const OrganizationDirectoryRail = ({
  action,
  className,
  corridors = [],
  corridorsLabel = "Import corridors",
  description,
  eyebrow,
  items,
  title,
}: OrganizationDirectoryRailProps) => (
  <section
    aria-label={title}
    className={cn("border-border border-y bg-control/35", className)}
  >
    <div className="mx-auto max-w-[94rem] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="font-semibold text-micro text-muted-foreground uppercase tracking-[0.13em]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 font-semibold text-foreground text-xl tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-muted-foreground text-sm leading-5">
              {description}
            </p>
          ) : null}
        </div>

        {corridors.length ? (
          <nav aria-label={corridorsLabel} className="overflow-x-auto">
            <ul className="flex min-w-max gap-2">
              {corridors.map((corridor) => (
                <li key={corridor.id}>
                  <Link
                    className="flex h-9 items-center gap-2 rounded-full bg-control px-3.5 font-medium text-foreground/80 text-xs transition-colors hover:bg-control-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={corridor.href}
                  >
                    {corridor.label}
                    {corridor.meta ? (
                      <span className="text-micro text-muted-foreground">
                        {corridor.meta}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-stretch">
        <ul className="contents">
          {items.slice(0, 3).map((item) => (
            <DirectoryRailItem item={item} key={item.id} />
          ))}
        </ul>
        <Button
          asChild
          className="h-auto min-h-12 rounded-lg px-4 lg:w-32"
          variant="outline"
        >
          <Link href={action.href}>
            <span className="max-w-24 text-wrap text-center leading-4">
              {action.label}
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);
