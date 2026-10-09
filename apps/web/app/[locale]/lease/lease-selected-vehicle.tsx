"use client";

import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import { DealerVehicleFacts } from "@repo/marketplace-ui/components/dealer-vehicle-facts";
import Image from "@repo/marketplace-ui/components/public-image";
import { VehicleCardMoney } from "@repo/marketplace-ui/components/vehicle-card-money";
import {
  mobileVehicleCardBrandClassName,
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
import {
  getMobileVehicleCardHeading,
  getVehicleCardSpecFacts,
} from "@repo/marketplace-ui/lib/vehicle-card-policy";
import { useState } from "react";
import {
  type FinancingVehicleOption,
  leaseSelectorCopy,
} from "./lease-finance-policy";
import styles from "./lease-selected-vehicle.module.css";

const leasePriceCopy = {
  bg: {
    estimate: "Ориентировъчна месечна вноска",
    from: "от",
    month: "мес.",
    select: "Изберете",
  },
  en: {
    estimate: "Estimated monthly payment",
    from: "from",
    month: "mo.",
    select: "Select",
  },
};

function LeaseVehiclePrice({
  locale,
  vehicle,
}: {
  locale: "bg" | "en";
  vehicle: FinancingVehicleOption;
}) {
  const copy = leasePriceCopy[locale];
  return (
    <div className={mobileVehicleCardPriceSummaryClassName}>
      <p
        className={
          vehicle.monthlyLabel
            ? "font-normal text-card-spec text-muted-foreground tabular-nums lg:font-semibold lg:text-foreground lg:text-price"
            : mobileVehicleCardPriceClassName
        }
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
          className="order-first font-semibold text-foreground text-price tabular-nums lg:order-none lg:font-normal lg:text-meta lg:text-muted-foreground [&>span]:font-normal [&>span]:text-card-spec lg:[&>span]:text-meta"
          data-slot="lease-selected-vehicle-monthly"
          title={copy.estimate}
        >
          <span>{copy.from} </span>
          {vehicle.monthlyEstimate ? (
            <>
              <VehicleCardMoney
                locale={locale}
                money={vehicle.monthlyEstimate}
              />
              <span className="inline-block">/{copy.month}</span>
            </>
          ) : (
            vehicle.monthlyLabel
          )}
        </p>
      ) : null}
    </div>
  );
}

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
  const heading = getMobileVehicleCardHeading({
    spec: vehicle.filterData.spec,
    title: vehicle.title,
  });
  const copy = leasePriceCopy[locale];
  const selectionLabel = [
    `${copy.select} ${vehicle.title}`,
    vehicle.monthlyLabel && `${copy.from} ${vehicle.monthlyLabel}`,
    vehicle.priceLabel,
  ]
    .filter(Boolean)
    .join(", ");
  const brand = heading.brand ? (
    <p
      aria-hidden="true"
      className={`${mobileVehicleCardBrandClassName} lg:hidden`}
      data-slot="vehicle-card-brand"
      title={heading.brand}
    >
      {heading.brand}
    </p>
  ) : null;
  const vehicleHeading = (
    <h2
      aria-label={vehicle.title}
      className={mobileVehicleCardTitleClassName}
      data-slot="lease-selected-vehicle-title"
      title={vehicle.title}
    >
      <span aria-hidden="true" className="lg:hidden">
        {heading.title}
      </span>
      <span aria-hidden="true" className="hidden lg:inline">
        {vehicle.title}
      </span>
    </h2>
  );

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
        <div
          className={`${mobileVehicleCardInfoClassName} ${onClear ? styles.selectedInfo : ""}`}
          data-slot="lease-selected-vehicle-info"
        >
          {onClear ? (
            <div className={`${styles.selectedHeading} lg:contents`}>
              <div
                className={`${styles.brandRow} lg:contents`}
                data-slot="lease-selected-vehicle-brand-row"
              >
                {brand}
                <button
                  aria-label={leaseSelectorCopy[locale].clearSelection}
                  className={`${styles.clear} absolute top-1.5 left-1.5 z-30 grid size-11 place-items-center rounded-full bg-white text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-200`}
                  data-slot="lease-selected-vehicle-clear"
                  onClick={onClear}
                  title={leaseSelectorCopy[locale].clearSelection}
                  type="button"
                >
                  <DealerUiIcon className="size-[18px]" name="close" />
                </button>
              </div>
              {vehicleHeading}
            </div>
          ) : (
            <>
              {brand}
              {vehicleHeading}
            </>
          )}
          <LeaseVehiclePrice locale={locale} vehicle={vehicle} />
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
          aria-label={selectionLabel}
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
    </article>
  );
}
