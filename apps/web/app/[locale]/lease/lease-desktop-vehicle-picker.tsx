"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import Image from "@repo/marketplace-ui/components/public-image";
import { ArrowRight, Check, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import styles from "./lease-desktop-vehicle-picker.module.css";
import {
  type FinancingVehicleOption,
  leaseSelectorCopy,
  searchLeaseVehicles,
} from "./lease-finance-policy";
import { LeaseSelectedVehicle } from "./lease-selected-vehicle";

export function LeaseDesktopVehiclePicker({
  locale,
  vehicles,
  selectedVehicle,
  onSelect,
}: {
  locale: "bg" | "en";
  vehicles: FinancingVehicleOption[];
  selectedVehicle?: FinancingVehicleOption;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const copy = leaseSelectorCopy[locale];
  const matches = searchLeaseVehicles(vehicles, query, locale);
  const text =
    locale === "bg"
      ? {
          browse: "Разгледайте наличните автомобили",
          selected: "Избран автомобил",
          empty: "Няма намерени автомобили. Опитайте друга марка или модел.",
          description:
            "Потърсете марка или модел и изберете автомобил за лизинг.",
        }
      : {
          browse: "Browse available vehicles",
          selected: "Vehicle selected",
          empty: "No vehicles found. Try another make or model.",
          description:
            "Search by make or model, then choose a vehicle to finance.",
        };
  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
        }
      }}
      open={open}
    >
      <div className={styles.picker}>
        <DialogTrigger asChild>
          <button
            aria-label={
              selectedVehicle
                ? `${copy.changeVehicle}: ${selectedVehicle.title}`
                : copy.vehicleLabel
            }
            className={styles.trigger}
            data-selected={Boolean(selectedVehicle)}
            data-slot="lease-desktop-vehicle-trigger"
            type="button"
          >
            {selectedVehicle ? (
              <>
                <span className={styles.selectedLabel}>
                  <Check aria-hidden="true" size={15} />
                  {text.selected}
                </span>
                <span className={styles.vehicle}>
                  <Image
                    alt=""
                    className={styles.image}
                    height={180}
                    sizes="104px"
                    src={selectedVehicle.imageUrl}
                    width={208}
                  />
                  <span className={styles.facts}>
                    <strong data-slot="lease-desktop-selected-title">
                      {selectedVehicle.title}
                    </strong>
                    <small>
                      {selectedVehicle.yearLabel} ·{" "}
                      {selectedVehicle.mileageLabel}
                    </small>
                    <b>{selectedVehicle.priceLabel}</b>
                  </span>
                </span>
                <span className={styles.change}>
                  {copy.changeVehicle}
                  <ArrowRight aria-hidden="true" size={14} />
                </span>
              </>
            ) : (
              <>
                <span className={styles.plus}>
                  <Plus aria-hidden="true" size={28} strokeWidth={1.5} />
                </span>
                <strong>{copy.vehicleLabel}</strong>
                <span className={styles.hint}>{text.browse}</span>
              </>
            )}
          </button>
        </DialogTrigger>
        <div className={styles.footer}>
          {selectedVehicle ? (
            <Link href={selectedVehicle.detailHref}>
              {copy.detailAction}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          ) : (
            <span>{text.description}</span>
          )}
        </div>
      </div>
      <DialogContent
        className={styles.dialog}
        data-slot="lease-desktop-vehicle-dialog"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{copy.searchTitle}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <label className={styles.search}>
          <Search aria-hidden="true" size={18} />
          <input
            aria-label={copy.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            type="search"
            value={query}
          />
        </label>
        <div className={styles.results}>
          {matches.length ? (
            matches.map((vehicle) => (
              <LeaseSelectedVehicle
                key={vehicle.id}
                locale={locale}
                onSelect={() => {
                  onSelect(vehicle.id);
                  setOpen(false);
                }}
                selected={selectedVehicle?.id === vehicle.id}
                vehicle={vehicle}
              />
            ))
          ) : (
            <output className={styles.empty}>{text.empty}</output>
          )}
        </div>
        <DialogClose asChild>
          <button
            aria-label={
              locale === "bg" ? "Затвори избора" : "Close vehicle selection"
            }
            className={styles.close}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
