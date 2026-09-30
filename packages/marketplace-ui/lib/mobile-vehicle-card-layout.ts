/** Shared mobile geometry for inventory links and financing selection cards. */
export const mobileVehicleCardClassName =
  "grid grid-cols-[44%_minmax(0,1fr)] lg:flex lg:flex-row";

export const mobileVehicleCardImageSizes = "44vw";

export const mobileVehicleCardMediaClassName =
  "relative col-start-1 row-start-1 z-10 m-3 mr-0 min-w-0 self-stretch overflow-hidden rounded-lg bg-secondary lg:z-auto lg:m-0 lg:aspect-auto lg:min-h-28 lg:w-[40%] lg:min-w-24 lg:max-w-44 lg:shrink-0 lg:rounded-none";

/** One right-hand content block; the photo stretches to the same row height. */
export const mobileVehicleCardContentClassName =
  "col-start-2 row-start-1 flex min-h-39 min-w-0 flex-col gap-2 px-2 py-3 lg:min-h-0 lg:flex-1 lg:justify-center lg:px-2.5";

/** Title and price stay adjacent, including listings without a payment label. */
export const mobileVehicleCardInfoClassName =
  "flex min-w-0 flex-col gap-1 lg:block";

export const mobileVehicleCardFactsClassName = "min-w-0";

export const mobileVehicleCardPriceSummaryClassName =
  "flex min-w-0 flex-col gap-0.5 lg:block";

/** Single-line mobile titles retain their full text in the accessible heading. */
export const mobileVehicleCardTitleClassName =
  "truncate font-medium text-card-title text-foreground tracking-normal lg:line-clamp-2 lg:whitespace-normal";

export const mobileVehicleCardPriceClassName =
  "font-semibold text-price text-foreground tabular-nums tracking-normal";
