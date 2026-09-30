import { formatMoney, type Money } from "@repo/marketplace";

/** Display the supplied estimate in its original currency on every surface. */
export const formatListingMonthlyEstimate = (
  estimate: Money | undefined,
  locale?: string
) => (estimate ? formatMoney(estimate, locale) : undefined);
