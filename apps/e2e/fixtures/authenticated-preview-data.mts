import type { AuthenticatedPreviewContract } from "./authenticated-preview-contract.mts";

const fixtureSlug = (marker: string) =>
  marker
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

export const buildAuthenticatedPreviewFixture = (
  contract: Pick<
    AuthenticatedPreviewContract,
    "databaseMarker" | "fixtureVersion"
  >
) => {
  const marker = contract.databaseMarker;
  const slug = fixtureSlug(marker);
  const bases = Object.fromEntries(
    ["buyer", "seller", "dealer", "admin", "operator", "foreign"].map(
      (persona) => [persona, `am_e2e_${slug}_${persona}`]
    )
  ) as Readonly<Record<string, string>>;

  return {
    bases,
    ids: {
      dealerDirectoryEntry: `${bases.dealer}_directory_entry`,
      dealerListing: `${bases.dealer}_listing`,
      dealerOrganization: `${bases.dealer}_org`,
      foreignLead: `${bases.foreign}_lead`,
      foreignListing: `${bases.foreign}_listing`,
      foreignOrganization: `${bases.foreign}_org`,
      operatorSavedSearch: `${bases.operator}_saved_search`,
      sellerListing: `${bases.seller}_listing`,
    },
    names: {
      buyerConversation: `AM-E2E ${marker} buyer conversation`,
      buyerSavedSearch: `AM-E2E ${marker} buyer saved search ${contract.fixtureVersion}`,
      dealerLead: `AM-E2E ${marker} dealer lead`,
      dealerListing: `AM-E2E ${marker} dealer inventory`,
      dealerOrganization: `AM-E2E ${marker} dealer-importer`,
      foreignLead: `AM-E2E ${marker} foreign dealer lead`,
      foreignListing: `AM-E2E ${marker} foreign dealer inventory`,
      foreignOrganization: `AM-E2E ${marker} foreign dealer`,
      moderation: `AM-E2E ${marker} moderation`,
      operatorSavedSearch: `AM-E2E ${marker} operator saved search`,
      sellerListing: `AM-E2E ${marker} seller baseline`,
    },
    slug,
  } as const;
};
