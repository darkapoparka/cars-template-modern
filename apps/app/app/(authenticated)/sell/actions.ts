"use server";

import { ActiveListingQuotaError } from "@repo/database/commerce";
import {
  createListingDraft,
  transitionOwnedListing,
  updateOwnedListing,
} from "@repo/database/listings";
import {
  type ListingStatus,
  listingInputFromFormData,
} from "@repo/marketplace";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireListingActor } from "./actor";
import {
  getListingMutationReturnHref,
  parseListingReturnContext,
} from "./listing-return-context";

const requiredString = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
};

export const createListingAction = async (formData: FormData) => {
  const actor = await requireListingActor();
  const listing = await createListingDraft(
    listingInputFromFormData(formData),
    actor
  );
  revalidatePath("/sell/listings");
  revalidatePath("/dealer/inventory");
  redirect(`/sell/listings/${listing.id}/edit`);
};

export const updateListingAction = async (formData: FormData) => {
  const actor = await requireListingActor();
  const listingId = requiredString(formData, "listingId");
  const returnContext = actor.clerkOrgId
    ? parseListingReturnContext(formData.get("returnContext"))
    : undefined;
  await updateOwnedListing(
    listingId,
    listingInputFromFormData(formData),
    actor
  );
  revalidatePath("/sell/listings");
  revalidatePath("/dealer/inventory");
  redirect(getListingMutationReturnHref(listingId, returnContext));
};

const ownerTransitions = new Set<ListingStatus>([
  "active",
  "archived",
  "draft",
  "expired",
  "paused",
  "pending_review",
  "sold",
]);

export const transitionListingAction = async (formData: FormData) => {
  const actor = await requireListingActor();
  const listingId = requiredString(formData, "listingId");
  const toStatus = requiredString(formData, "toStatus") as ListingStatus;
  const returnContext = actor.clerkOrgId
    ? parseListingReturnContext(formData.get("returnContext"))
    : undefined;

  if (!ownerTransitions.has(toStatus)) {
    throw new Error("Unsupported listing status");
  }

  try {
    await transitionOwnedListing(listingId, toStatus, actor);
  } catch (error) {
    if (error instanceof ActiveListingQuotaError) {
      const returnHref = getListingMutationReturnHref(listingId, returnContext);
      const separator = returnHref.includes("?") ? "&" : "?";
      redirect(
        `${returnHref}${separator}quota=${encodeURIComponent(
          error.decision.code
        )}`
      );
    }
    throw error;
  }
  revalidatePath("/sell/listings");
  revalidatePath("/dealer/inventory");
  redirect(getListingMutationReturnHref(listingId, returnContext));
};
