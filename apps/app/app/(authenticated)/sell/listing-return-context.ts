import { z } from "zod";

export const listingReturnContextSchema = z.enum(["dealer-inventory"]);

export type ListingReturnContext = z.infer<typeof listingReturnContextSchema>;

export const parseListingReturnContext = (
  value: unknown
): ListingReturnContext | undefined => {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const result = listingReturnContextSchema.safeParse(firstValue);

  return result.success ? result.data : undefined;
};

export const getListingEditHref = (
  listingId: string,
  returnContext?: ListingReturnContext
) => {
  const path = `/sell/listings/${listingId}/edit`;

  return returnContext
    ? `${path}?returnContext=${encodeURIComponent(returnContext)}`
    : path;
};

export const getListingMutationReturnHref = (
  listingId: string,
  returnContext?: ListingReturnContext
) =>
  returnContext === "dealer-inventory"
    ? "/dealer/inventory"
    : getListingEditHref(listingId);
