import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { getListingPath, type VehicleListing } from "@repo/marketplace";
import {
  getAccountListingSaveFlowHref,
  type ListingOrganizationRole,
  VehicleCard,
} from "@repo/marketplace-ui";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getPublicAppBaseUrl } from "@/lib/public-app-url";
import { PUBLIC_LISTING_PAGE_SIZE } from "@/lib/public-marketplace-data";

interface PublicInventoryListProps {
  basePath: string;
  emptyMessage: string;
  gridClassName?: string;
  listings: VehicleListing[];
  locale: string;
  page: number;
  sellerOrganizationRole?: ListingOrganizationRole;
  totalListings: number;
}

const getPageHref = (basePath: string, page: number) =>
  page > 1 ? `${basePath}?page=${page}` : basePath;

export const PublicInventoryList = ({
  basePath,
  emptyMessage,
  gridClassName,
  listings,
  locale,
  page,
  sellerOrganizationRole,
  totalListings,
}: PublicInventoryListProps) => {
  const normalizedLocale = normalizeSeoLocale(locale);
  const localizedBasePath = getLocalizedPath(normalizedLocale, basePath);
  const totalPages = Math.ceil(totalListings / PUBLIC_LISTING_PAGE_SIZE);

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          gridClassName
        )}
      >
        {listings.map((listing, index) => (
          <VehicleCard
            density="compact"
            desktopLayout="grid"
            href={getLocalizedPath(normalizedLocale, getListingPath(listing))}
            key={listing.id}
            listing={listing}
            locale={normalizedLocale}
            priority={index === 0}
            saveHref={getAccountListingSaveFlowHref(
              getPublicAppBaseUrl(),
              listing
            )}
            sellerOrganizationRole={sellerOrganizationRole}
            viewMode="grid"
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-6 flex items-center justify-center gap-2"
        >
          {page > 1 ? (
            <Button asChild size="sm" variant="outline">
              <Link href={getPageHref(localizedBasePath, page - 1)} rel="prev">
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                {normalizedLocale === "bg" ? "Назад" : "Previous"}
              </Link>
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              {normalizedLocale === "bg" ? "Назад" : "Previous"}
            </Button>
          )}
          <span className="px-2 text-muted-foreground text-sm">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild size="sm" variant="outline">
              <Link href={getPageHref(localizedBasePath, page + 1)} rel="next">
                {normalizedLocale === "bg" ? "Напред" : "Next"}
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              {normalizedLocale === "bg" ? "Напред" : "Next"}
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
        </nav>
      ) : null}
    </>
  );
};
