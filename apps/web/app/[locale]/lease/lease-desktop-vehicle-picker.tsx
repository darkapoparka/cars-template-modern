"use client";

import { Button } from "@repo/design-system/components/ui/button";
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
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copy = leaseSelectorCopy[locale];
  const matches = searchLeaseVehicles(vehicles, query, locale);
  const text =
    locale === "bg"
      ? {
          browse: "Разгледайте наличните автомобили",
          empty: "Няма намерени автомобили. Опитайте друга марка или модел.",
          description:
            "Потърсете марка или модел и изберете автомобил за лизинг.",
        }
      : {
          browse: "Browse available vehicles",
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
        {selectedVehicle ? (
          <div
            className={styles.selectedCard}
            data-slot="lease-desktop-selected-card"
          >
            <div className={styles.cardHeader}>
              <strong
                className={styles.title}
                data-slot="lease-desktop-selected-title"
                title={selectedVehicle.title}
              >
                {selectedVehicle.title}
              </strong>
              <Button
                aria-label={copy.clearSelection}
                className={styles.clear}
                onClick={() => {
                  onSelect("");
                  requestAnimationFrame(() =>
                    triggerRef.current?.focus({ preventScroll: true })
                  );
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" size={16} />
              </Button>
            </div>
            <div className={styles.media}>
              <Image
                alt={selectedVehicle.imageAlt}
                className={styles.image}
                fill
                sizes="(min-width: 1280px) 325px, 270px"
                src={selectedVehicle.imageUrl}
              />
            </div>
            <DialogTrigger asChild>
              <Button
                className={styles.change}
                data-selected="true"
                data-slot="lease-desktop-vehicle-trigger"
                ref={triggerRef}
                type="button"
                variant="outline"
              >
                {copy.changeVehicle}
                <ArrowRight aria-hidden="true" size={14} />
              </Button>
            </DialogTrigger>
          </div>
        ) : (
          <DialogTrigger asChild>
            <button
              aria-label={copy.vehicleLabel}
              className={styles.trigger}
              data-selected="false"
              data-slot="lease-desktop-vehicle-trigger"
              ref={triggerRef}
              type="button"
            >
              <span className={styles.plus}>
                <Plus aria-hidden="true" size={28} strokeWidth={1.5} />
              </span>
              <strong>{copy.vehicleLabel}</strong>
              <span className={styles.hint}>{text.browse}</span>
            </button>
          </DialogTrigger>
        )}
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
