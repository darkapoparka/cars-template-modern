"use server";

import { auth } from "@repo/auth/server";
import { type AlertCadence, database } from "@repo/database";
import { ensureMarketplaceAccount } from "@repo/database/accounts";
import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOwnedBuyerResourceWhere } from "../buyer-authorization";

const requireUserId = async (): Promise<string> => {
  const session = await auth();

  if (!session.userId) {
    session.redirectToSignIn();
    throw new Error("Authentication required");
  }

  return session.userId;
};

const getRequiredString = (formData: FormData, key: string): string => {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }

  return value.trim();
};

export const saveListingAction = async (formData: FormData) => {
  const userId = await requireUserId();
  const account = await ensureMarketplaceAccount(userId);
  const listingId = getRequiredString(formData, "listingId");
  const listing = await database.marketplaceListing.findFirst({
    select: { id: true },
    where: { deletedAt: null, id: listingId, status: "active" },
  });

  if (!listing) {
    throw new Error("This listing is not available to save");
  }

  await database.savedListing.upsert({
    create: { accountId: account.id, listingId },
    update: {},
    where: {
      accountId_listingId: { accountId: account.id, listingId },
    },
  });

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/saved");
};

export const removeSavedListingAction = async (formData: FormData) => {
  const userId = await requireUserId();
  const account = await ensureMarketplaceAccount(userId);
  const id = getRequiredString(formData, "savedListingId");

  await database.savedListing.deleteMany({
    where: getOwnedBuyerResourceWhere(account.id, id),
  });

  revalidatePath("/");
  revalidatePath("/saved");
};

export const createSavedSearchAction = async (formData: FormData) => {
  const userId = await requireUserId();
  const account = await ensureMarketplaceAccount(userId);
  const title = getRequiredString(formData, "title").slice(0, 80);
  const filtersJson = getRequiredString(formData, "filters");
  if (filtersJson.length > 64 * 1024) {
    throw new Error("Saved search filters are invalid");
  }
  let rawFilters: unknown;

  try {
    rawFilters = JSON.parse(filtersJson);
  } catch {
    throw new Error("Saved search filters are invalid");
  }

  if (
    !rawFilters ||
    typeof rawFilters !== "object" ||
    Array.isArray(rawFilters)
  ) {
    throw new Error("Saved search filters are invalid");
  }

  const filters = parseMarketplaceSearchParams(
    rawFilters as Record<string, string | string[] | number | undefined>
  );

  await database.savedSearch.create({
    data: {
      cadence: "daily",
      filters,
      title,
      accountId: account.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/saved/searches");
  redirect("/saved/searches");
};

const allowedCadences = new Set<AlertCadence>([
  "off",
  "instant",
  "daily",
  "weekly",
]);

export const updateSavedSearchAction = async (formData: FormData) => {
  const userId = await requireUserId();
  const account = await ensureMarketplaceAccount(userId);
  const id = getRequiredString(formData, "savedSearchId");
  const title = getRequiredString(formData, "title").slice(0, 80);
  const cadence = getRequiredString(formData, "cadence");

  if (!allowedCadences.has(cadence as AlertCadence)) {
    throw new Error("Unsupported alert cadence");
  }

  await database.savedSearch.updateMany({
    data: { cadence: cadence as AlertCadence, title },
    where: getOwnedBuyerResourceWhere(account.id, id),
  });

  revalidatePath("/");
  revalidatePath("/saved/searches");
};

export const deleteSavedSearchAction = async (formData: FormData) => {
  const userId = await requireUserId();
  const account = await ensureMarketplaceAccount(userId);
  const id = getRequiredString(formData, "savedSearchId");

  await database.savedSearch.deleteMany({
    where: getOwnedBuyerResourceWhere(account.id, id),
  });

  revalidatePath("/");
  revalidatePath("/saved/searches");
};
