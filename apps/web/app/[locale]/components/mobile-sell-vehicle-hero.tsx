"use client";
import { publicSite } from "@repo/marketplace/site-config";

import { mobileDealerContentClassName } from "@repo/marketplace-ui";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  mobileSearchIconClassName,
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
        title={content.title}
        tone="sell"
      >
        <div className="h-full">
          <button
            aria-haspopup="dialog"
            aria-label={content.vinEntry}
            className={`${mobileSearchTriggerClassName} bg-white ring-black/5 focus-visible:outline-ring active:bg-zinc-100`}
            data-slot="mobile-sell-vin-entry"
            disabled={!ready}
            onClick={onOpenVin}
            type="button"
          >
            <ScanLine
              aria-hidden="true"
              className={mobileSearchIconClassName}
              strokeWidth={1.75}
            />
            <span className={mobileSearchTriggerLabelClassName}>
              {vin || content.vinEntry}
            </span>
            <DealerUiIcon
              className={mobileSearchIconClassName}
              name="chevronRight"
            />
          </button>
        </div>
      </MobileDealerServiceHero>
      <div
        className={`${mobileDealerContentClassName} pb-3`}
        data-slot="mobile-dealer-content"
      >
        <button
          aria-haspopup="dialog"
          aria-label={content.noVin}
          className="group mx-auto flex min-h-11 items-center rounded-full px-1 font-medium text-compact-control focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-60"
          data-slot="mobile-sell-manual-entry"
          disabled={!ready}
          onClick={onOpenDetails}
          type="button"
        >
          <span className="inline-flex h-9 items-center rounded-full bg-zinc-950 px-4 text-white transition-colors group-hover:bg-zinc-800 group-active:bg-zinc-700">
            {content.noVinLabel}
          </span>
        </button>
      </div>
      {inventoryShelf}
    </div>
  );
};
