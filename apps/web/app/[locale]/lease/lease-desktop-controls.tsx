"use client";

import { withBasePath } from "@repo/internationalization/paths";
import { DesktopActionButton } from "@repo/marketplace-ui/components/desktop-action-panel";
import Image from "@repo/marketplace-ui/components/public-image";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import styles from "./lease-desktop-controls.module.css";
import {
  type FinancingVehicleOption,
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
        <h2>{title}</h2>

        <div className={styles.financeFields} data-slot="finance-fields">
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="finance-vehicle-desktop">
                {copy.vehicleLabel}
              </label>
              <Link href={selectedVehicle.detailHref}>
                {copy.detailAction}
                <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </div>
            <div className={styles.vehicleControl}>
              <Image
                alt=""
                aria-hidden="true"
                className={styles.vehicleImage}
                height={72}
                sizes="54px"
                src={selectedVehicle.imageUrl}
                width={108}
              />
              <select
                aria-label={copy.vehicleLabel}
                className={styles.select}
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
            </div>
          </div>

          <label className={styles.field} htmlFor="finance-deposit">
            <span>{copy.depositLabel}</span>
            <select
              className={styles.select}
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
              className={styles.select}
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
              <div>
                <p className={styles.summaryLabel}>{copy.estimateLabel}</p>
                <p className={styles.summaryValue}>
                  {selectedVehicle.monthlyLabel}
                </p>
              </div>
            ) : null}
          </div>

          <div className={styles.financeActions} data-slot="finance-actions">
            <DesktopActionButton asChild>
              <a href={withBasePath(phoneHref)}>
                <Phone aria-hidden="true" className="size-4" />
                {copy.phoneAction}
              </a>
            </DesktopActionButton>
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
