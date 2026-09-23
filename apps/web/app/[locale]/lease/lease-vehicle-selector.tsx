"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { withBasePath } from "@repo/internationalization/paths";
import { Phone } from "lucide-react";
import { useSearchParams } from "next/navigation";
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
  desktopTitle: string;
  faqs: readonly { question: string; answer: string }[];
  locale: "bg" | "en";
  phoneHref: string;
  vehicles: FinancingVehicleOption[];
}

export const LeaseVehicleSelector = ({
  contactHref,
  faqs,
  locale,
  phoneHref,
  desktopTitle,
  vehicles,
}: LeaseVehicleSelectorProps) => {
  const copy = leaseSelectorCopy[locale];
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "";
  const deposit =
    copy.depositOptions.find(
      (option) => option.value === searchParams.get("deposit")
    )?.value ?? "flexible";
  const term =
    copy.termOptions.find((option) => option.value === searchParams.get("term"))
      ?.value ?? "flexible";
  const selectedVehicle = getLeaseSelectedVehicle(vehicles, vehicleId);
  const mobileSelectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === vehicleId
  );
  const updatePreference = (
    name: string,
    value: string,
    keepFlexible = false
  ) => {
    const url = new URL(window.location.href);
    if (value && (value !== "flexible" || keepFlexible)) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
    // Next copies its internal history state and updates useSearchParams for
    // native calls. Passing that internal state ourselves bypasses the update.
    window.history.replaceState(null, "", url);
  };
  const selectVehicle = (id: string) => updatePreference("vehicle", id);
  const setDeposit = (value: string) => updatePreference("deposit", value);
  const setTerm = (value: string) => updatePreference("term", value);
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
          className="mt-3 h-11 gap-2 rounded-lg bg-brand px-5 text-brand-foreground shadow-none hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)]"
        >
          <a href={withBasePath(phoneHref)}>
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
        deposit={searchParams.has("deposit") ? deposit : "20"}
        locale={locale}
        onDepositChange={(value) => updatePreference("deposit", value, true)}
        onTermChange={(value) => updatePreference("term", value, true)}
        onVehicleChange={selectVehicle}
        phoneHref={phoneHref}
        selectedVehicle={mobileSelectedVehicle}
        term={searchParams.has("term") ? term : "48"}
        title={desktopTitle}
        vehicles={vehicles}
      />
    </div>
  );
};
