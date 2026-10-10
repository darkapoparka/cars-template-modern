/** Shared mobile geometry; cap the photo column so wider phones favor copy. */
export const mobileVehicleCardClassName =
  "grid grid-cols-[min(42%,8.5rem)_minmax(0,1fr)] lg:flex lg:flex-row";

export const mobileVehicleCardImageSizes = "124px";

export const mobileVehicleCardMediaClassName =
  "relative col-start-1 row-start-1 z-10 mt-3 ml-3 aspect-auto min-w-0 self-stretch overflow-hidden rounded-lg bg-secondary lg:z-auto lg:m-0 lg:aspect-auto lg:min-h-28 lg:w-[40%] lg:min-w-24 lg:max-w-44 lg:shrink-0 lg:self-stretch lg:rounded-none";

/** One linked surface: copy beside the photo, with full-width facts beneath both. */
export const mobileVehicleCardContentClassName =
  "col-span-2 col-start-1 row-span-2 row-start-1 grid min-w-0 grid-cols-subgrid grid-rows-subgrid lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:gap-2 lg:px-2.5 lg:py-3";

export const mobileVehicleCardBrandClassName =
  "truncate font-normal text-micro text-muted-foreground tracking-normal";

/** Title and price stay adjacent, including listings without a payment label. */
export const mobileVehicleCardInfoClassName =
  "col-start-2 row-start-1 mt-3 flex min-w-0 flex-col justify-center gap-1 self-stretch pr-3 pl-2 lg:mt-0 lg:block lg:p-0";

export const mobileVehicleCardFactsClassName =
  "col-span-2 row-start-2 min-w-0 px-3 pt-2.5 pb-3 lg:p-0";

export const mobileVehicleCardPriceSummaryClassName =
  "flex min-w-0 flex-col gap-0.5 lg:block";

/** Mobile model names stay on one line; the full accessible title is retained. */
export const mobileVehicleCardTitleClassName =
  "truncate font-medium text-card-title text-foreground tracking-normal lg:line-clamp-2 lg:whitespace-normal";

export const mobileVehicleCardPriceClassName =
  "font-semibold text-price text-foreground tabular-nums tracking-normal";
