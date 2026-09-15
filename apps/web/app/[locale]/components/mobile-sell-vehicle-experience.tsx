"use client";

import { useEffect, useRef, useState } from "react";
import {
  hasSellVehicleDetails,
  type SellVehicleDraft,
} from "../../../lib/sell-vehicle-draft";
import { MobileSellHowItWorksDrawer } from "./mobile-sell-how-it-works-drawer";
import { MobileSellVehicleDetailsDrawer } from "./mobile-sell-vehicle-details-drawer";
import { MobileSellVehicleHero } from "./mobile-sell-vehicle-hero";
import { mobileSellVehicleCopy } from "./mobile-sell-vehicle-policy";

interface MobileSellVehicleExperienceProps {
  contactHref: string;
  initialDraft: SellVehicleDraft;
  locale: "bg" | "en";
}

export const MobileSellVehicleExperience = ({
  contactHref,
  initialDraft,
  locale,
}: MobileSellVehicleExperienceProps) => {
  const [entryMode, setEntryMode] = useState<"vin" | "manual">("manual");
  const detailsTriggerRef = useRef<HTMLElement | null>(null);
  const infoTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [ready, setReady] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [vin, setVin] = useState(initialDraft.vin);
  const startAfterInfo = useRef(false);
  useEffect(() => {
    setReady(true);
    if (
      window.matchMedia("(max-width: 1023px)").matches &&
      hasSellVehicleDetails(initialDraft)
    ) {
      setDetailsOpen(true);
    }
  }, [initialDraft]);

  const startFromInfo = () => {
    detailsTriggerRef.current = infoTriggerRef.current;
    setEntryMode("manual");
    startAfterInfo.current = true;
    setInfoOpen(false);
  };
  return (
    <>
      <MobileSellVehicleHero
        inventoryShelf={
          <section className="px-4 pb-6" data-slot="sell-next-steps">
            <h2 className="sr-only">
              {locale === "bg" ? "Какво следва" : "What happens next"}
            </h2>
            <ol className="grid gap-5 rounded-2xl bg-white p-4">
              {mobileSellVehicleCopy[locale].howSteps.map(
                ({ title, description }, index) => (
                  <li key={title}>
                    <p className="font-semibold text-compact-control text-zinc-950">
                      <span className="mr-2 text-micro text-muted-foreground tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {title}
                    </p>
                    <p className="mt-1 text-meta text-zinc-600">
                      {description}
                    </p>
                  </li>
                )
              )}
            </ol>
          </section>
        }
        locale={locale}
        onOpenDetails={(event) => {
          detailsTriggerRef.current = event.currentTarget;
          setEntryMode("manual");
          setDetailsOpen(true);
        }}
        onOpenInfo={(event) => {
          infoTriggerRef.current = event.currentTarget;
          setInfoOpen(true);
        }}
        onOpenVin={(event) => {
          detailsTriggerRef.current = event.currentTarget;
          setEntryMode("vin");
          setDetailsOpen(true);
        }}
        ready={ready}
        vin={vin}
      />
      <MobileSellVehicleDetailsDrawer
        contactHref={contactHref}
        focusVin={entryMode === "vin"}
        initialDraft={initialDraft}
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
        onRestoreFocus={() =>
          infoTriggerRef.current?.focus({ preventScroll: true })
        }
        onStart={startFromInfo}
        open={infoOpen}
      />
    </>
  );
};
