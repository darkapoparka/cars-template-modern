import "server-only";

import { database } from "@repo/database";
import { ensureMarketplaceAccount } from "@repo/database/accounts";
import type { PriceCurrency } from "@repo/marketplace";

export interface BuyerSavedListing {
  readonly id: string;
  readonly listing: {
    readonly id: string;
    readonly imageAlt: string | null;
    readonly imageUrl: string | null;
    readonly locationCity: string;
    readonly locationCountry: string;
    readonly locationRegion: string | null;
    readonly mileageValue: number;
    readonly priceAmount: number;
    readonly priceCurrency: PriceCurrency;
    readonly slug: string;
    readonly title: string;
    readonly year: number;
  };
  readonly savedAt: Date;
}

export interface BuyerSavedSearch {
  readonly cadence: string;
  readonly createdAt: Date;
  readonly description: string | null;
  readonly filters: unknown;
  readonly id: string;
  readonly lastRunAt: Date | null;
  readonly newMatches: number;
  readonly title: string;
  readonly updatedAt: Date;
}

export interface BuyerInquiry {
  readonly channel: string;
  readonly contactMethod: string;
  readonly createdAt: Date;
  readonly id: string;
  readonly listing: {
    readonly slug: string;
    readonly title: string;
  } | null;
  readonly message: string | null;
  readonly status: string;
  readonly updatedAt: Date;
}

const toPriceCurrency = (value: string): PriceCurrency => {
  if (value === "BGN" || value === "EUR") {
    return value;
  }

  throw new Error(`Unsupported listing currency: ${value}`);
};

export const listBuyerSavedListings = async (
  userId: string
): Promise<BuyerSavedListing[]> => {
  const account = await ensureMarketplaceAccount(userId);
  const rows = await database.savedListing.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    where: { accountId: account.id },
    select: {
      createdAt: true,
      id: true,
      listing: {
        select: {
          id: true,
          images: {
            orderBy: { position: "asc" },
            select: { alt: true, url: true },
            take: 1,
          },
          locationCity: true,
          locationCountry: true,
          locationRegion: true,
          mileageValue: true,
          priceAmountMinor: true,
          priceCurrency: true,
          slug: true,
          title: true,
          year: true,
        },
      },
    },
  });

  return rows.map(({ createdAt, id, listing }) => ({
    id,
    savedAt: createdAt,
    listing: {
      id: listing.id,
      imageAlt: listing.images[0]?.alt ?? null,
      imageUrl: listing.images[0]?.url ?? null,
      locationCity: listing.locationCity,
      locationCountry: listing.locationCountry,
      locationRegion: listing.locationRegion,
      mileageValue: listing.mileageValue,
      priceAmount: Math.round(listing.priceAmountMinor / 100),
      priceCurrency: toPriceCurrency(listing.priceCurrency),
      slug: listing.slug,
      title: listing.title,
      year: listing.year,
    },
  }));
};

export const listBuyerSavedSearches = async (
  userId: string
): Promise<BuyerSavedSearch[]> => {
  const account = await ensureMarketplaceAccount(userId);

  return database.savedSearch.findMany({
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 100,
    where: { accountId: account.id },
  });
};

export const listBuyerInquiries = async (
  userId: string
): Promise<BuyerInquiry[]> => {
  const account = await ensureMarketplaceAccount(userId);

  return database.lead.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    where: { buyerAccountId: account.id, deletedAt: null },
    select: {
      channel: true,
      contactMethod: true,
      createdAt: true,
      id: true,
      listing: { select: { slug: true, title: true } },
      message: true,
      status: true,
      updatedAt: true,
    },
  });
};
