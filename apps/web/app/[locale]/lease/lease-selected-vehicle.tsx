"use client";

import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import { DealerVehicleFacts } from "@repo/marketplace-ui/components/dealer-vehicle-facts";
import { mobileVehicleCardContentClassName, mobileVehicleCardMediaClassName } from "@repo/marketplace-ui/lib/mobile-vehicle-card-layout";
import Image from "next/image";
import { useState } from "react";
import {
  type FinancingVehicleOption,
  leaseSelectorCopy,
} from "./lease-finance-policy";

export function LeaseSelectedVehicle({
  locale,
  onClear,
  onSelect,
  selected = false,
  vehicle,
}: {
  locale: "bg" | "en";
  onClear?: () => void;
  onSelect?: () => void;
  selected?: boolean;
  vehicle: FinancingVehicleOption;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const facts = [
    [locale === "bg" ? "Година" : "Year", vehicle.yearLabel],
    [locale === "bg" ? "Пробег" : "Mileage", vehicle.mileageLabel],
    [locale === "bg" ? "Гориво" : "Fuel", vehicle.fuelLabel],
    [
      locale === "bg" ? "Скоростна кутия" : "Transmission",
      vehicle.transmissionLabel,
    ],
  ];

  return (
    <article
      className={`relative flex overflow-hidden rounded-xl bg-card ${onSelect ? "" : "mt-4"}`}
      data-slot={
        onSelect ? "lease-vehicle-option" : "lease-selected-vehicle-card"
      }
    >
      <div className={mobileVehicleCardMediaClassName}>
        {failedImageUrl === vehicle.imageUrl ? (
          <div className="absolute inset-0 grid place-items-center text-zinc-400">
            <DealerUiIcon className="size-9" name="car" />
          </div>
        ) : (
          <Image
            alt={vehicle.imageAlt}
            className="object-cover object-[center_85%] lg:object-[center_80%]"
            fill
            onError={() => setFailedImageUrl(vehicle.imageUrl)}
            sizes="240px"
            src={vehicle.imageUrl}
          />
        )}
      </div>
      <div className={mobileVehicleCardContentClassName}>
        <div className="min-w-0 space-y-0.5">
          <h2
            className="line-clamp-2 font-medium text-[16px] text-zinc-950 leading-5 tracking-tight"
            data-slot="lease-selected-vehicle-title"
            title={vehicle.title}
          >
            {vehicle.title}
          </h2>
          <div className="min-w-0">
          <p
            className="font-bold text-[18px] text-zinc-950 tabular-nums leading-5 tracking-tight"
            data-slot="lease-selected-vehicle-price"
          >
            {vehicle.priceLabel}
          </p>
          {vehicle.monthlyLabel ? (
            <p
              className="text-[12px] text-muted-foreground leading-4"
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
        <DealerVehicleFacts
          facts={facts.map(([id, value]) => ({ id, value }))}
          label={locale === "bg" ? "Характеристики" : "Specifications"}
        />
      </div>
      {onSelect ? (
        <button
          aria-label={`${vehicle.title}, ${vehicle.priceLabel}`}
          aria-pressed={selected}
          className="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-[-2px] active:bg-black/5"
          data-vehicle-selected={selected}
          onClick={onSelect}
          type="button"
        >
          {selected ? (
            <span className="absolute top-1.5 left-1.5 grid size-8 place-items-center rounded-full bg-white text-[var(--lead-site-accent)]">
              <DealerUiIcon className="size-5" name="check" />
            </span>
          ) : null}
        </button>
      ) : null}
      {onClear ? (
        <button
          aria-label={leaseSelectorCopy[locale].clearSelection}
          className="absolute top-1.5 left-1.5 grid size-11 place-items-center rounded-full bg-white text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-200"
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
