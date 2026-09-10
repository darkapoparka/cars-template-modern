"use client";

import {
  getMobileQuickPillClassName,
  mobileDealerContentClassName,
} from "@repo/marketplace-ui";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import { ScanLine } from "lucide-react";
import type { ReactNode } from "react";
import { MobileDealerServiceHero } from "./mobile-dealer-service-hero";
import { mobileSellVehicleCopy } from "./mobile-sell-vehicle-policy";
import { MobileServiceHelpButton } from "./mobile-service-help";

export const MobileSellVehicleHero = ({
  inventoryShelf,
  locale,
  onOpenDetails,
  onOpenInfo,
  onOpenVin,
  vin,
}: {
  inventoryShelf: ReactNode;
  locale: "bg" | "en";
  onOpenDetails: () => void;
  onOpenInfo: () => void;
  onOpenVin: () => void;
  vin: string;
}) => {
  const content = mobileSellVehicleCopy[locale];

  return (
    <div className="bg-background lg:hidden">
      <MobileDealerServiceHero
        helpAction={
          <MobileServiceHelpButton
            onClick={onOpenInfo}
            title={content.howTitle}
          />
        }
        imageSrc="/images/sell/day-night-mobile-studio-v1.png"
        locale={locale}
        tone="sell"
      >
        <div className="h-full">
          <button
            aria-haspopup="dialog"
            aria-label={
              locale === "bg" ? "Въведете VIN номер" : "Enter VIN number"
            }
            className="flex h-[52px] w-full items-center gap-2 rounded-full bg-white px-4 text-left text-zinc-950 focus-visible:outline-2 focus-visible:outline-zinc-900 focus-visible:outline-offset-2 active:bg-zinc-100"
            data-slot="mobile-sell-vin-entry"
            onClick={onOpenVin}
            type="button"
          >
            <ScanLine
              aria-hidden="true"
              className="size-[18px] shrink-0 text-zinc-500"
            />
            <span
              className={`min-w-0 flex-1 truncate text-[16px] ${vin ? "text-zinc-950" : "text-zinc-500"}`}
            >
              {vin || content.vin}
            </span>
            <DealerUiIcon className="size-5 shrink-0" name="chevronRight" />
          </button>
        </div>
      </MobileDealerServiceHero>
      <div
        className={`${mobileDealerContentClassName} pb-3`}
        data-slot="mobile-dealer-content"
      >
        <h1 className="sr-only">{content.title}</h1>
        <button
          aria-haspopup="dialog"
          className={getMobileQuickPillClassName(true, "mx-auto flex w-fit")}
          data-slot="mobile-sell-manual-entry"
          onClick={() => onOpenDetails()}
          type="button"
        >
          <span>
            {locale === "bg"
              ? "Без VIN? Въведете данни"
              : "No VIN? Enter details"}
          </span>
          <DealerUiIcon className="size-4 shrink-0" name="arrowRight" />
        </button>
      </div>
      {inventoryShelf}
    </div>
  );
};
