"use server";

import { createPublicLead } from "@repo/database/leads";
import { log } from "@repo/observability/log";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicRequestContext } from "@/lib/public-form-security";
import { enforcePublicLeadRateLimit } from "@/lib/public-lead-rate-limit";
import { isPublicListingLeadSubmissionAvailable } from "@/lib/public-listing-contact";
import { submitPublicListingLead } from "@/lib/public-listing-lead-submission";
import { getPublicMarketplaceListing } from "@/lib/public-marketplace-data";

export const createListingLeadAction = async (formData: FormData) => {
  const locale = normalizeSeoLocale(String(formData.get("locale") ?? "en"));
  const slug = String(formData.get("slug") ?? "").trim();

  const requestHeaders = await headers();
  const requestContext = getPublicRequestContext(requestHeaders);
  const result = await submitPublicListingLead(formData, requestContext, {
    available: isPublicListingLeadSubmissionAvailable(),
    findListing: (listingSlug, buyerCountryCode) =>
      getPublicMarketplaceListing(listingSlug, {
        destinationCountryCode: buyerCountryCode,
      }),
    persistLead: createPublicLead,
    rateLimit: enforcePublicLeadRateLimit,
    report: (event, fields) => {
      if (event.endsWith("_delivered") || event.endsWith("_suppressed")) {
        log.info(event, fields);
      } else if (
        event.endsWith("_rejected") ||
        event.endsWith("_rate_limited")
      ) {
        log.warn(event, fields);
      } else {
        log.error(event, fields);
      }
    },
  });

  const redirectParams = new URLSearchParams();
  if (result.status === "success") {
    redirectParams.set("sent", "1");
  } else {
    redirectParams.set("error", result.status);
  }
  if (result.buyerCountryCode) {
    redirectParams.set("deliverTo", result.buyerCountryCode);
  }
  redirect(
    `${getLocalizedPath(
      locale,
      `/listing/${encodeURIComponent(slug)}/contact`
    )}?${redirectParams.toString()}`
  );
};
