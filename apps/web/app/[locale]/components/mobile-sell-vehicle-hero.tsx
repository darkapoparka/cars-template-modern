"use client";
import { publicSite } from "@repo/marketplace/site-config";

import {
  getMobileQuickPillClassName,
  mobileDealerContentClassName,
} from "@repo/marketplace-ui";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  mobileSearchTriggerClassName,
  mobileSearchTriggerLabelClassName,
} from "@repo/marketplace-ui/lib/mobile-form-control";
import { ScanLine } from "lucide-react";
import type { MouseEventHandler, ReactNode } from "react";
import { MobileDealerServiceHero } from "./mobile-dealer-service-hero";
import { mobileSellVehicleCopy } from "./mobile-sell-vehicle-policy";
import { MobileServiceHelpButton } from "./mobile-service-help";

export const MobileSellVehicleHero = ({
  inventoryShelf,
  locale,
  onOpenDetails,
  onOpenInfo,
  onOpenVin,
  ready,
  vin,
}: {
  inventoryShelf: ReactNode;
  locale: "bg" | "en";
  onOpenDetails: MouseEventHandler<HTMLButtonElement>;
  onOpenInfo: MouseEventHandler<HTMLButtonElement>;
  onOpenVin: MouseEventHandler<HTMLButtonElement>;
  ready: boolean;
  vin: string;
}) => {
  const content = mobileSellVehicleCopy[locale];

  return (
    <div className="bg-background lg:hidden">
      <MobileDealerServiceHero
        helpAction={
          <MobileServiceHelpButton
            disabled={!ready}
            onClick={onOpenInfo}
            title={content.howTitle}
          />
        }
        imageSrc={publicSite.artwork.sellHero}
        locale={locale}
        tone="sell"
      >
        <div className="h-full">
          <button
            aria-haspopup="dialog"
            aria-label={
              locale === "bg" ? "Въведете VIN номер" : "Enter VIN number"
            }
            className={`${mobileSearchTriggerClassName} bg-white ring-black/5 focus-visible:outline-ring active:bg-zinc-100`}
            data-slot="mobile-sell-vin-entry"
            disabled={!ready}
            onClick={onOpenVin}
            type="button"
          >
            <ScanLine
              aria-hidden="true"
              className="size-[18px] shrink-0 text-zinc-500"
            />
            <span className={mobileSearchTriggerLabelClassName}>
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
          disabled={!ready}
          onClick={onOpenDetails}
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
