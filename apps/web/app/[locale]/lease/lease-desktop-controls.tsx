"use client";

import { withBasePath } from "@repo/internationalization/paths";
import { formatMoney } from "@repo/marketplace";
import { DesktopActionButton } from "@repo/marketplace-ui/components/desktop-action-panel";
import Image from "@repo/marketplace-ui/components/public-image";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import styles from "./lease-desktop-controls.module.css";
import {
  type FinancingVehicleOption,
  getLeasePrincipal,
  leaseSelectorCopy,
} from "./lease-finance-policy";

function PreferenceChoices({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className={styles.choiceField}>
      <legend>{label}</legend>
      <div className={styles.choices}>
        {options.map((option) => (
          <label className={styles.choice} key={option.value}>
            <input
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

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
  const text =
    locale === "bg"
      ? {
          flexible: "По избор",
          term: "Срок в месеци",
          principal: "Сума за финансиране",
          chooseDeposit: "По договаряне",
          monthly: "Месечна вноска",
          tailored: "По индивидуална оферта",
          note: "Изберете предпочитанията си. Месечната вноска, лихвата и таксите се потвърждават в офертата.",
          advertised: "По обява от",
          beforeCosts: "Преди лихва и такси",
        }
      : {
          flexible: "Flexible",
          term: "Term in months",
          principal: "Amount to finance",
          chooseDeposit: "To be agreed",
          monthly: "Monthly payment",
          tailored: "Personalised offer",
          note: "Choose your preferences. Monthly payment, interest and fees are confirmed in your offer.",
          advertised: "Advertised from",
          beforeCosts: "Before interest and fees",
        };
  const principal = getLeasePrincipal(selectedVehicle.priceAmount, deposit);
  const money = (amount: number) =>
    formatMoney({ amount, currency: selectedVehicle.priceCurrency }, locale);
  return (
    <div
      className={`hidden lg:grid ${styles.desktopControls}`}
      data-slot="lease-desktop-controls"
    >
      <div className={styles.vehicle}>
        <div className={styles.vehicleLabel}>
          <label htmlFor="finance-vehicle-desktop">{copy.vehicleLabel}</label>
          <Link href={selectedVehicle.detailHref}>
            {copy.detailAction}
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
        <select
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
        <div className={styles.vehiclePreview}>
          <Image
            alt={selectedVehicle.imageAlt}
            className={styles.vehicleImage}
            height={240}
            sizes="128px"
            src={selectedVehicle.imageUrl}
            width={320}
          />
          <div className={styles.vehicleFacts}>
            <span>
              {selectedVehicle.yearLabel} · {selectedVehicle.mileageLabel}
            </span>
            <strong>{selectedVehicle.priceLabel}</strong>
            {selectedVehicle.monthlyLabel ? (
              <small>
                {text.advertised}
                <br />
                {selectedVehicle.monthlyLabel}
              </small>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.preferences}>
        <h2 className={styles.heading}>{title}</h2>
        <PreferenceChoices
          label={copy.depositShortLabel}
          name="desktop-finance-deposit"
          onChange={onDepositChange}
          options={copy.depositOptions.map((option) => ({
            ...option,
            label: option.value === "flexible" ? text.flexible : option.label,
          }))}
          value={deposit}
        />
        <PreferenceChoices
          label={text.term}
          name="desktop-finance-term"
          onChange={onTermChange}
          options={copy.termOptions.map((option) => ({
            ...option,
            label: option.value === "flexible" ? text.flexible : option.value,
          }))}
          value={term}
        />
        <p className={styles.note} data-slot="finance-note">
          {text.note}
        </p>
      </div>

      <div className={styles.summary} data-slot="finance-summary">
        <div aria-live="polite" className={styles.principal}>
          <span>{text.principal}</span>
          <strong data-slot="finance-principal">
            {principal ? money(principal.amountToFinance) : text.chooseDeposit}
          </strong>
          <small>{text.beforeCosts}</small>
        </div>
        <dl className={styles.breakdown}>
          <div>
            <dt>{copy.depositShortLabel}</dt>
            <dd data-slot="finance-initial-payment">
              {principal ? money(principal.initialPayment) : text.flexible}
            </dd>
          </div>
          <div>
            <dt>{text.monthly}</dt>
            <dd>{text.tailored}</dd>
          </div>
        </dl>
        <div className={styles.actions} data-slot="finance-actions">
          <DesktopActionButton asChild>
            <a href={withBasePath(phoneHref)}>
              <Phone aria-hidden="true" />
              {copy.phoneAction}
            </a>
          </DesktopActionButton>
        </div>
      </div>
    </div>
  );
};
