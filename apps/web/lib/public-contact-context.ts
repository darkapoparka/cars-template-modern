import { isoCountryCodeSchema } from "@repo/marketplace";
import { getLocalizedPath } from "@repo/seo/metadata";

export type PublicContactTopic = "buyer" | "dealer" | "importer" | "other";

type SearchValue = string | string[] | undefined;

export interface PublicContactSearchParams {
  context?: SearchValue;
  deliverTo?: SearchValue;
  intent?: SearchValue;
  listing?: SearchValue;
  topic?: SearchValue;
}

export interface ListingDeliveryContactContext {
  destinationCountryCode?: string;
  kind: "listing-delivery";
  listingSlug: string;
}

export interface ParsedPublicContactRequest {
  defaultTopic: PublicContactTopic;
  listingDelivery?: ListingDeliveryContactContext;
}

const contactTopics: readonly PublicContactTopic[] = [
  "buyer",
  "dealer",
  "importer",
  "other",
];
const validSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const getFirstValue = (value: SearchValue) =>
  (Array.isArray(value) ? value[0] : value)?.trim();

const getTopic = (value: SearchValue): PublicContactTopic => {
  const topic = getFirstValue(value);
  return contactTopics.includes(topic as PublicContactTopic)
    ? (topic as PublicContactTopic)
    : "dealer";
};

export const parsePublicContactRequest = (
  searchParams: PublicContactSearchParams
): ParsedPublicContactRequest => {
  const context = getFirstValue(searchParams.context);
  const intent = getFirstValue(searchParams.intent);
  const listingSlug = getFirstValue(searchParams.listing);
  const isListingDeliveryRequest =
    Boolean(listingSlug && validSlugPattern.test(listingSlug)) &&
    (context === "listing-delivery" || intent === "delivery-quote");

  if (!(isListingDeliveryRequest && listingSlug)) {
    return { defaultTopic: getTopic(searchParams.topic) };
  }

  const parsedDestination = isoCountryCodeSchema.safeParse(
    getFirstValue(searchParams.deliverTo)
  );

  return {
    defaultTopic: "importer",
    listingDelivery: {
      ...(parsedDestination.success
        ? { destinationCountryCode: parsedDestination.data }
        : {}),
      kind: "listing-delivery",
      listingSlug,
    },
  };
};

export const buildPublicListingDeliveryContactHref = ({
  deliverTo,
  locale,
  slug,
}: {
  deliverTo?: string;
  locale: "bg" | "en";
  slug: string;
}) => {
  const params = new URLSearchParams({
    context: "listing-delivery",
    listing: slug,
    topic: "importer",
  });
  const parsedDestination = isoCountryCodeSchema.safeParse(deliverTo);

  if (parsedDestination.success) {
    params.set("deliverTo", parsedDestination.data);
  }

  return `${getLocalizedPath(locale, "/contact")}?${params.toString()}#contact-form`;
};
