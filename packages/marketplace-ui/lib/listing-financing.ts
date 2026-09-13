import { formatMoney, type Money } from "@repo/marketplace";

/** Match the PDP summary and financing artwork without relabelling BGN as EUR. */
export const formatListingMonthlyEstimate = (
  estimate: Money | undefined,
  locale?: string
) =>
  estimate
    ? formatMoney(
        estimate.currency === "BGN"
          ? { amount: estimate.amount / 1.955_83, currency: "EUR" }
          : estimate,
        locale
      )
    : undefined;
