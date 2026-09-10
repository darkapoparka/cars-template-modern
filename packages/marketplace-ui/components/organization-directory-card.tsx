import { Card } from "@repo/design-system/components/ui/card";
import { cn } from "@repo/design-system/lib/utils";
import { resolveOrganizationDirectoryCardData } from "../lib/organization-directory-card-policy";
import type { OrganizationDirectoryCardProps } from "../lib/organization-directory-card-types";
import { OrganizationDirectoryCardLayouts } from "./organization-directory-card-layouts";

export type {
  OrganizationDirectoryAction,
  OrganizationDirectoryCardData,
  OrganizationDirectoryCardLabels,
  OrganizationDirectoryCardProps,
  OrganizationDirectoryInventoryStatus,
  OrganizationDirectoryInventorySummary,
  OrganizationDirectoryPreviewImage,
  OrganizationDirectoryProfileKind,
  OrganizationDirectorySignal,
  OrganizationDirectorySignalKind,
  OrganizationDirectoryTradeLane,
} from "../lib/organization-directory-card-types";

export const OrganizationDirectoryCard = ({
  className,
  compactDesktop = false,
  desktopLayout,
  labels: providedLabels,
  organization,
  priority = false,
}: OrganizationDirectoryCardProps) => {
  const { badges, brands, labels, previewImages, services, tradeLanes } =
    resolveOrganizationDirectoryCardData(organization, providedLabels);
  const hasResponsiveDesktopLayout = Boolean(compactDesktop || desktopLayout);

  return (
    <Card
      className={cn(
        "group relative h-full gap-0 overflow-hidden rounded-xl py-0 shadow-none transition-[border-color,box-shadow] hover:border-foreground/25",
        hasResponsiveDesktopLayout && "lg:hover:shadow-md",
        desktopLayout === "list"
          ? "lg:min-h-0"
          : compactDesktop && "lg:min-h-[15.75rem]",
        className
      )}
      data-slot="organization-directory-card"
    >
      <OrganizationDirectoryCardLayouts
        badges={badges}
        brands={brands}
        compactDesktop={compactDesktop}
        desktopLayout={desktopLayout}
        labels={labels}
        organization={organization}
        previewImages={previewImages}
        priority={priority}
        services={services}
        tradeLanes={tradeLanes}
      />
    </Card>
  );
};
