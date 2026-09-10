"use client";

import { type ReactNode, useRef, useState } from "react";
import { MobileSellHowItWorksDrawer } from "./mobile-sell-how-it-works-drawer";
import { MobileSellVehicleDetailsDrawer } from "./mobile-sell-vehicle-details-drawer";
import { MobileSellVehicleHero } from "./mobile-sell-vehicle-hero";

interface MobileSellVehicleExperienceProps {
  contactHref: string;
  inventory: ReactNode;
  locale: "bg" | "en";
}

export const MobileSellVehicleExperience = ({
  contactHref,
  inventory,
  locale,
}: MobileSellVehicleExperienceProps) => {
  const [entryMode, setEntryMode] = useState<"vin" | "manual">("manual");
  const detailsTriggerRef = useRef<HTMLElement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [vin, setVin] = useState("");
  const startAfterInfo = useRef(false);

  const startFromInfo = () => {
    setEntryMode("manual");
    startAfterInfo.current = true;
    setInfoOpen(false);
  };

  return (
    <>
      <MobileSellVehicleHero
        inventoryShelf={
          <section
            aria-labelledby="sell-trade-in-heading"
            className="px-4 pb-6"
            data-slot="sell-inline-inventory"
          >
            <h2 className="sr-only" id="sell-trade-in-heading">
              {locale === "bg" ? "Налични автомобили" : "Available vehicles"}
            </h2>
            <div className="grid gap-2">{inventory}</div>
          </section>
        }
        locale={locale}
        onOpenDetails={() => {
          detailsTriggerRef.current = document.activeElement as HTMLElement;
          setEntryMode("manual");
          setDetailsOpen(true);
        }}
        onOpenInfo={() => setInfoOpen(true)}
        onOpenVin={() => {
          detailsTriggerRef.current = document.activeElement as HTMLElement;
          setEntryMode("vin");
          setDetailsOpen(true);
        }}
        vin={vin}
      />
      <MobileSellVehicleDetailsDrawer
        contactHref={contactHref}
        focusVin={entryMode === "vin"}
        locale={locale}
        onOpenChange={setDetailsOpen}
        onRestoreFocus={() =>
          detailsTriggerRef.current?.focus({ preventScroll: true })
        }
        onVinChange={setVin}
        open={detailsOpen}
        vin={vin}
      />
      <MobileSellHowItWorksDrawer
        locale={locale}
        onAfterClose={() => {
          if (startAfterInfo.current) {
            startAfterInfo.current = false;
            requestAnimationFrame(() => setDetailsOpen(true));
          }
        }}
        onOpenChange={setInfoOpen}
        onStart={startFromInfo}
        open={infoOpen}
      />
    </>
  );
};
