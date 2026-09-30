"use client";

import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import { DealerVehicleFacts } from "@repo/marketplace-ui/components/dealer-vehicle-facts";
import Image from "@repo/marketplace-ui/components/public-image";
import { VehicleCardMoney } from "@repo/marketplace-ui/components/vehicle-card-money";
import {
  mobileVehicleCardClassName,
  mobileVehicleCardContentClassName,
  mobileVehicleCardFactsClassName,
  mobileVehicleCardImageSizes,
  mobileVehicleCardInfoClassName,
  mobileVehicleCardMediaClassName,
  mobileVehicleCardPriceClassName,
  mobileVehicleCardPriceSummaryClassName,
  mobileVehicleCardTitleClassName,
} from "@repo/marketplace-ui/lib/mobile-vehicle-card-layout";
import { getVehicleCardSpecFacts } from "@repo/marketplace-ui/lib/vehicle-card-policy";
import { useState } from "react";
import {
  type FinancingVehicleOption,
  leaseSelectorCopy,
} from "./lease-finance-policy";

export function LeaseSelectedVehicle({
  locale,
  onClear,
  onSelect,
  priority = false,
  selected = false,
  vehicle,
}: {
  locale: "bg" | "en";
  onClear?: () => void;
  onSelect?: () => void;
  priority?: boolean;
  selected?: boolean;
  vehicle: FinancingVehicleOption;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const facts = getVehicleCardSpecFacts(vehicle.filterData, locale);

  return (
    <article
      className={`${mobileVehicleCardClassName} relative overflow-hidden rounded-xl bg-card`}
      data-slot={
        onSelect ? "lease-vehicle-option" : "lease-selected-vehicle-card"
      }
    >
      <div
        className={mobileVehicleCardMediaClassName}
        data-slot="vehicle-card-media"
      >
        {failedImageUrl === vehicle.imageUrl ? (
          <div className="absolute inset-0 grid place-items-center text-zinc-400">
            <DealerUiIcon className="size-9" name="car" />
          </div>
        ) : (
          <Image
            alt={vehicle.imageAlt}
            className="object-cover object-[center_60%] lg:object-center"
            fill
            loading={priority || !onSelect ? "eager" : "lazy"}
            onError={() => setFailedImageUrl(vehicle.imageUrl)}
            sizes={`(max-width: 1023px) ${mobileVehicleCardImageSizes}, 240px`}
            src={vehicle.imageUrl}
          />
        )}
      </div>
      <div className={mobileVehicleCardContentClassName}>
        <div className={mobileVehicleCardInfoClassName}>
          <h2
            className={mobileVehicleCardTitleClassName}
            data-slot="lease-selected-vehicle-title"
            title={vehicle.title}
          >
            {vehicle.title}
          </h2>
          <div className={mobileVehicleCardPriceSummaryClassName}>
            <p
              className={mobileVehicleCardPriceClassName}
              data-slot="lease-selected-vehicle-price"
            >
              <VehicleCardMoney
                locale={locale}
                money={{
                  amount: vehicle.priceAmount,
                  currency: vehicle.priceCurrency,
                }}
              />
            </p>
            {vehicle.monthlyLabel ? (
              <p
                className="text-card-spec text-muted-foreground lg:text-meta"
                title={
                  locale === "bg"
                    ? "Ориентировъчна месечна вноска"
                    : "Estimated monthly payment"
                }
              >
                {locale === "bg" ? "от " : "from "}
                {vehicle.monthlyLabel}
              </p>
            ) : null}
          </div>
        </div>
        <div className={mobileVehicleCardFactsClassName}>
          <DealerVehicleFacts
            facts={facts}
            label={locale === "bg" ? "Характеристики" : "Specifications"}
          />
        </div>
      </div>
      {onSelect ? (
        <button
          aria-label={`${locale === "bg" ? "Изберете" : "Select"} ${vehicle.title}, ${vehicle.priceLabel}`}
          aria-pressed={selected}
          className="absolute inset-0 z-20 rounded-xl focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-[-2px] active:bg-black/5"
          data-vehicle-selected={selected}
          onClick={onSelect}
          type="button"
        >
          {selected ? (
            <span className="absolute top-1.5 left-1.5 grid size-8 place-items-center rounded-full bg-white text-brand-text">
              <DealerUiIcon className="size-5" name="check" />
            </span>
          ) : null}
        </button>
      ) : null}
      {onClear ? (
        <button
          aria-label={leaseSelectorCopy[locale].clearSelection}
          className="absolute top-1.5 left-1.5 z-30 grid size-11 place-items-center rounded-full bg-white text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-200"
          onClick={onClear}
          title={leaseSelectorCopy[locale].clearSelection}
          type="button"
        >
          <DealerUiIcon className="size-[18px]" name="close" />
        </button>
      ) : null}
    </article>
  );
}
