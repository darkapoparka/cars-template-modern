import "server-only";
import { isDealershipSite } from "@repo/marketplace/site-config";

const dealerBindingPattern = /^[A-Za-z0-9_-]{1,128}$/;

/** No host/query/body value can select another dealer's inventory or enquiry destination. */
export const getPublicDealerBinding = (
  environment: { AUTOMARKET_DEALER_ORG_ID?: string } = {
    AUTOMARKET_DEALER_ORG_ID: process.env.AUTOMARKET_DEALER_ORG_ID,
  }
): string | undefined => {
  const id = environment.AUTOMARKET_DEALER_ORG_ID;
  return id && dealerBindingPattern.test(id) ? id : undefined;
};
export const requirePublicInventoryScope = () => {
  if (!isDealershipSite) {
    return {};
  }
  const dealerOrgId = getPublicDealerBinding();
  if (!dealerOrgId) {
    throw new Error(
      "Live dealership inventory requires a server-side organization binding"
    );
  }
  return { dealerOrgId };
};
