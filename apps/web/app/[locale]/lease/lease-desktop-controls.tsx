"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { withBasePath } from "@repo/internationalization/paths";
import Image from "@repo/marketplace-ui/components/public-image";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import styles from "./lease-desktop-controls.module.css";
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
  phoneHref,
  selectedVehicle,
  term,
  title,
  vehicles,
}: {
  deposit: string;
  locale: "bg" | "en";
  onDepositChange: (deposit: string) => void;
  onTermChange: (term: string) => void;
  onVehicleChange: (vehicleId: string) => void;
  phoneHref: string;
  selectedVehicle: FinancingVehicleOption;
  term: string;
  title: string;
  vehicles: FinancingVehicleOption[];
}) => {
  const copy = leaseSelectorCopy[locale];

  return (
    <div
      className={`hidden lg:grid ${styles.desktopControls}`}
      data-slot="lease-desktop-controls"
    >
      <div className={styles.preferences}>
        <div className={styles.intro}>
          <h2>{title}</h2>
        </div>

        <div className={styles.financeFields} data-slot="finance-fields">
          <label className={styles.field}>
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
                  {vehicle.title}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field} htmlFor="finance-deposit">
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

          <label className={styles.field} htmlFor="finance-term">
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

        <div className={styles.offerRow}>
          <Link
            aria-label={copy.detailAction}
            className={styles.vehiclePreview}
            href={selectedVehicle.detailHref}
          >
            <Image
              alt=""
              className={styles.vehicleImage}
              height={96}
              sizes="72px"
              src={selectedVehicle.imageUrl}
              width={144}
            />
            <span className={styles.vehicleCopy}>
              <strong>{selectedVehicle.title}</strong>
              <span>
                {copy.detailAction} <ArrowRight aria-hidden="true" size={14} />
              </span>
            </span>
          </Link>
          <div
            aria-live="polite"
            className={styles.financeSummary}
            data-slot="finance-summary"
          >
            <div>
              <p className={styles.summaryLabel}>{copy.priceLabel}</p>
              <p className={styles.summaryValue}>
                {selectedVehicle.priceLabel}
              </p>
            </div>
            {selectedVehicle.monthlyLabel ? (
              <div className={styles.estimate}>
                <p className={styles.summaryLabel}>{copy.estimateLabel}</p>
                <p className={styles.summaryValue}>
                  {selectedVehicle.monthlyLabel}
                </p>
              </div>
            ) : null}
          </div>

          <div className={styles.financeActions} data-slot="finance-actions">
            <Button
              asChild
              className="h-11 gap-2 rounded-xl bg-brand px-4 text-brand-foreground text-compact-control shadow-none hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)]"
            >
              <a href={withBasePath(phoneHref)}>
                <Phone aria-hidden="true" className="size-4" />
                {copy.phoneAction}
              </a>
            </Button>
          </div>
        </div>

        <p className={styles.financeNote} data-slot="finance-note">
          {copy.note}{" "}
          {locale === "bg"
            ? "Изборът на срок и вноска не преизчислява тази сума."
            : "Changing preferences does not recalculate this estimate."}
        </p>
      </div>
    </div>
  );
};
