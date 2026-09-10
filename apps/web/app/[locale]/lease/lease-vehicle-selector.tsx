"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Phone } from "lucide-react";
import { useState } from "react";
import { LeaseDesktopControls } from "./lease-desktop-controls";
import {
  buildLeaseFinancingRequestHref,
  type FinancingVehicleOption,
  getLeaseSelectedVehicle,
  leaseSelectorCopy,
} from "./lease-finance-policy";
import { LeaseMobileSelection } from "./lease-mobile-selection";

export type { FinancingVehicleOption } from "./lease-finance-policy";

interface LeaseVehicleSelectorProps {
  contactHref: string;
  faqs: readonly { question: string; answer: string }[];
  initialVehicleId?: string;
  locale: "bg" | "en";
  phoneDisplay: string;
  phoneHref: string;
  vehicles: FinancingVehicleOption[];
}

export const LeaseVehicleSelector = ({
  contactHref,
  initialVehicleId = "",
  faqs,
  locale,
  phoneDisplay,
  phoneHref,
  vehicles,
}: LeaseVehicleSelectorProps) => {
  const copy = leaseSelectorCopy[locale];
  const [vehicleId, setVehicleId] = useState(
    initialVehicleId || vehicles[0]?.id || ""
  );
  const [mobileVehicleId, setMobileVehicleId] = useState(initialVehicleId);
  const [deposit, setDeposit] = useState("flexible");
  const [term, setTerm] = useState("flexible");
  const selectedVehicle = getLeaseSelectedVehicle(vehicles, vehicleId);
  const mobileSelectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === mobileVehicleId
  );
  const selectVehicle = (id: string) => {
    setVehicleId(id);
    setMobileVehicleId(id);
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("vehicle", id);
    } else {
      url.searchParams.delete("vehicle");
    }
    window.history.replaceState(window.history.state, "", url);
  };
  const clearVehicle = () => {
    selectVehicle("");
    requestAnimationFrame(() => {
      document
        .getElementById("lease-mobile-title")
        ?.focus({ preventScroll: true });
    });
  };

  if (!selectedVehicle) {
    return (
      <div className="mt-6 rounded-lg bg-secondary p-4 text-center">
        <p className="text-muted-foreground text-sm">{copy.empty}</p>
        <Button
          asChild
          className="mt-3 h-11 gap-2 rounded-lg bg-[var(--lead-site-accent)] px-5 text-white shadow-none hover:bg-[var(--lead-site-accent-hover)]"
        >
          <a href={phoneHref}>
            <Phone aria-hidden="true" className="size-4" />
            {copy.phoneAction}
          </a>
        </Button>
      </div>
    );
  }

  const financeRequestHref = buildLeaseFinancingRequestHref({
    contactHref,
    term,
    deposit,
    vehicleTitle: mobileSelectedVehicle?.title,
  });

  return (
    <div className="lg:mt-6" data-slot="lease-vehicle-selector">
      <LeaseMobileSelection
        faqs={faqs}
        financeRequestHref={financeRequestHref}
        locale={locale}
        onClearVehicle={clearVehicle}
        onSelectVehicle={selectVehicle}
        preferences={{
          term,
          deposit,
          onTermChange: setTerm,
          onDepositChange: setDeposit,
        }}
        selectedVehicle={mobileSelectedVehicle}
        vehicles={vehicles}
      />

      <LeaseDesktopControls
        deposit={deposit}
        locale={locale}
        onDepositChange={setDeposit}
        onTermChange={setTerm}
        onVehicleChange={selectVehicle}
        phoneDisplay={phoneDisplay}
        phoneHref={phoneHref}
        selectedVehicle={selectedVehicle}
        term={term}
        vehicles={vehicles}
      />
    </div>
  );
};
