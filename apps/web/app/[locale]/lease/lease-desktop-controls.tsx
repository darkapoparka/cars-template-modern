"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import {
  type FinancingVehicleOption,
  leaseSelectClassName,
  leaseSelectorCopy,
} from "./lease-finance-policy";

export const LeaseDesktopControls = ({
  deposit,
  locale,
  onDepositChange,
  onTermChange,
  onVehicleChange,
  phoneDisplay,
  phoneHref,
  selectedVehicle,
  term,
  vehicles,
}: {
  deposit: string;
  locale: "bg" | "en";
  onDepositChange: (deposit: string) => void;
  onTermChange: (term: string) => void;
  onVehicleChange: (vehicleId: string) => void;
  phoneDisplay: string;
  phoneHref: string;
  selectedVehicle: FinancingVehicleOption;
  term: string;
  vehicles: FinancingVehicleOption[];
}) => {
  const copy = leaseSelectorCopy[locale];
  const selectedDeposit = copy.depositOptions.find(
    (option) => option.value === deposit
  );
  const selectedTerm = copy.termOptions.find((option) => option.value === term);

  return (
    <div className="hidden lg:block" data-slot="lease-desktop-controls">
      <div className="grid grid-cols-2 gap-3 text-left lg:grid-cols-[minmax(15rem,1.7fr)_minmax(11rem,1fr)_minmax(10rem,0.9fr)]">
        <div className="col-span-2 grid gap-1.5 text-xs lg:col-span-1">
          <span>{copy.vehicleLabel}</span>
          <select
            aria-label={copy.vehicleLabel}
            className={leaseSelectClassName}
            id="finance-vehicle-desktop"
            onChange={(event) => onVehicleChange(event.target.value)}
            value={selectedVehicle.id}
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.title} · {vehicle.priceLabel}
              </option>
            ))}
          </select>
        </div>

        <label className="grid gap-1.5 text-xs" htmlFor="finance-deposit">
          <span>{copy.depositLabel}</span>
          <select
            className={leaseSelectClassName}
            id="finance-deposit"
            onChange={(event) => onDepositChange(event.target.value)}
            value={deposit}
          >
            {copy.depositOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs" htmlFor="finance-term">
          <span>{copy.termLabel}</span>
          <select
            className={leaseSelectClassName}
            id="finance-term"
            onChange={(event) => onTermChange(event.target.value)}
            value={term}
          >
            {copy.termOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-lg bg-secondary p-3.5 text-left sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs">{copy.selectionLabel}</p>
          <p className="truncate font-semibold text-sm">
            {selectedVehicle.title}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            {selectedDeposit?.label} · {selectedTerm?.label}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-5">
          <div>
            <p className="text-muted-foreground text-xs">{copy.priceLabel}</p>
            <p className="font-semibold text-sm">{selectedVehicle.priceLabel}</p>
          </div>
          {selectedVehicle.monthlyLabel ? (
            <div>
              <p className="text-muted-foreground text-xs">
                {copy.estimateLabel}
              </p>
              <p className="font-semibold text-[var(--lead-site-accent)] text-sm">
                {selectedVehicle.monthlyLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
        <Button
          asChild
          className="h-11 gap-2 rounded-lg bg-[var(--lead-site-accent)] px-5 text-white shadow-none hover:bg-[var(--lead-site-accent-hover)]"
        >
          <a href={phoneHref}>
            <Phone aria-hidden="true" className="size-4" />
            {copy.phoneAction}
          </a>
        </Button>
        <Button
          asChild
          className="h-11 gap-2 rounded-lg px-5"
          variant="secondary"
        >
          <Link href={selectedVehicle.detailHref}>
            {copy.detailAction}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>

      <p className="mt-3 text-center text-muted-foreground text-xs">
        {copy.note} {phoneDisplay}
      </p>
    </div>
  );
};
