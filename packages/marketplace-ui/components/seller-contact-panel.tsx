import { leadSite, type VehicleListing } from "@repo/marketplace";
import type { ListingOrganizationRole } from "../lib/listing-truth";
import {
  LeadSiteListingIdentityCard,
  SellerIdentityCard,
} from "./seller-identity-card";
import { SellerTransactionCard } from "./seller-transaction-card";

interface SellerContactPanelProps {
  readonly contactHref?: string;
  readonly listing: VehicleListing;
  readonly locale?: string;
  readonly reportHref?: string;
  readonly sellerOrganizationRole?: ListingOrganizationRole;
  readonly sellerProfileHref?: string;
}

export const SellerContactPanel = ({
  contactHref,
  listing,
  locale,
  reportHref,
  sellerOrganizationRole,
  sellerProfileHref,
}: SellerContactPanelProps) => (
  <div className="space-y-3 lg:sticky lg:top-20">
    <SellerTransactionCard
      contactHref={contactHref}
      listing={listing}
      locale={locale}
    />
    {leadSite.staticDemoMode ? (
      <LeadSiteListingIdentityCard listing={listing} locale={locale} />
    ) : (
      <SellerIdentityCard
        listing={listing}
        locale={locale}
        reportHref={reportHref}
        sellerOrganizationRole={sellerOrganizationRole}
        sellerProfileHref={sellerProfileHref}
      />
    )}
  </div>
);
