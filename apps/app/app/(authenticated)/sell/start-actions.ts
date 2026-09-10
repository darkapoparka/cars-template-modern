"use server";

import { createListingDraft, listOwnedListings } from "@repo/database/listings";
import { type ListingInput, listingInputSchema } from "@repo/marketplace";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireListingActor } from "./actor";
import {
  MINIMUM_DRAFT_DESCRIPTION,
  type MinimumVehicleBasics,
  minimumVehicleBasicsSchema,
} from "./start-contract";

const getFirstString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const parseMinimumVehicleBasics = (formData: FormData) =>
  minimumVehicleBasicsSchema.parse({
    category: getFirstString(formData, "category"),
    identifier: getFirstString(formData, "identifier"),
    identityMethod: getFirstString(formData, "identityMethod") || "manual",
    make: getFirstString(formData, "make"),
    model: getFirstString(formData, "model"),
    year: getFirstString(formData, "year"),
  });

const getBodyType = (
  category: MinimumVehicleBasics["category"]
): ListingInput["bodyType"] => {
  if (category === "motorbike") {
    return "motorcycle";
  }
  if (category === "truck") {
    return "truck";
  }
  if (category === "van") {
    return "van";
  }
  return "other";
};

const toMinimumDraftInput = (
  basics: MinimumVehicleBasics,
  city: string
): ListingInput =>
  listingInputSchema.parse({
    bodyType: getBodyType(basics.category),
    category: basics.category,
    description: MINIMUM_DRAFT_DESCRIPTION,
    fuelType: "other",
    locationCity: city,
    locationCountry: "Bulgaria",
    make: basics.make,
    mileageValue: 0,
    model: basics.model,
    priceAmount: 0,
    priceCurrency: "BGN",
    priceType: "fixed",
    title: `${basics.year} ${basics.make} ${basics.model}`,
    transmission: "manual",
    vin:
      basics.identityMethod === "vin"
        ? basics.identifier.toUpperCase()
        : undefined,
    year: basics.year,
  });

const isMatchingMinimumDraft = (
  listing: Awaited<ReturnType<typeof listOwnedListings>>[number],
  input: ListingInput
) =>
  listing.status === "draft" &&
  listing.category === input.category &&
  listing.make.toLocaleLowerCase() === input.make.toLocaleLowerCase() &&
  listing.model.toLocaleLowerCase() === input.model.toLocaleLowerCase() &&
  listing.year === input.year &&
  listing.description === MINIMUM_DRAFT_DESCRIPTION &&
  (listing.vin ?? undefined) === input.vin;

export const createOrResumeMinimumDraft = async (formData: FormData) => {
  const actor = await requireListingActor();
  const basics = parseMinimumVehicleBasics(formData);
  const input = toMinimumDraftInput(basics, actor.city || "Sofia");
  const ownedListings = await listOwnedListings(actor, { limit: 100 });
  const existing = ownedListings.find((listing) =>
    isMatchingMinimumDraft(listing, input)
  );
  const listing = existing ?? (await createListingDraft(input, actor));

  revalidatePath("/sell/listings");
  revalidatePath("/dealer/inventory");
  const searchParams = new URLSearchParams({ stage: "photos" });
  if (actor.clerkOrgId) {
    searchParams.set("returnContext", "dealer-inventory");
  }
  redirect(`/sell/listings/${listing.id}/edit?${searchParams.toString()}`);
};
