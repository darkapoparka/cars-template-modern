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
import { desktopOverlayStyles as overlayStyles } from "@repo/marketplace-ui";
import { DealerVehicleFacts } from "@repo/marketplace-ui/components/dealer-vehicle-facts";
import Image from "@repo/marketplace-ui/components/public-image";
import { getDealerVehicleTypeArtwork } from "@repo/marketplace-ui/lib/dealer-vehicle-types";
import { getVehicleCardSpecFacts } from "@repo/marketplace-ui/lib/vehicle-card-policy";
import { ChevronRight, RefreshCw, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnMobile = () => {
      if (!desktop.matches) {
        setOpen(false);
      }
    };
    desktop.addEventListener("change", closeOnMobile);
    return () => desktop.removeEventListener("change", closeOnMobile);
  }, []);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copy = leaseSelectorCopy[locale];
  const matches = searchLeaseVehicles(vehicles, query, locale);
  const text =
    locale === "bg"
      ? {
          change: "Променете",
          remove: "Премахнете",
          chooseHint: "Потърсете марка или модел",
          specifications: "Характеристики",
          empty: "Няма намерени автомобили. Опитайте друга марка или модел.",
          description:
            "Потърсете марка или модел и изберете автомобил за лизинг.",
        }
      : {
          change: "Change",
          remove: "Clear",
          chooseHint: "Search by make or model",
          specifications: "Specifications",
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
      <div className={styles.picker} data-slot="lease-desktop-picker">
        {selectedVehicle ? (
          <div
            className={styles.selectedCard}
            data-slot="lease-desktop-selected-card"
          >
            <div className={styles.media}>
              <Image
                alt={selectedVehicle.imageAlt}
                className={styles.image}
                fill
                sizes="200px"
                src={selectedVehicle.imageUrl}
              />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeader}>
                <div
                  className={styles.headingActions}
                  data-slot="lease-desktop-vehicle-actions"
                >
                  <Link
                    aria-label={`${copy.detailAction}: ${selectedVehicle.title}`}
                    className={styles.title}
                    data-slot="lease-desktop-selected-title"
                    href={selectedVehicle.detailHref}
                  >
                    {selectedVehicle.title}
                  </Link>
                  <DialogTrigger asChild>
                    <Button
                      aria-label={copy.changeVehicle}
                      className={styles.change}
                      data-selected="true"
                      data-slot="lease-desktop-vehicle-trigger"
                      ref={triggerRef}
                      type="button"
                      variant="outline"
                    >
                      <span className={styles.changeSurface}>
                        <RefreshCw
                          aria-hidden="true"
                          className="size-3.5"
                          size={14}
                        />
                        {text.change}
                      </span>
                    </Button>
                  </DialogTrigger>
                </div>
                <Button
                  aria-label={copy.clearSelection}
                  className={styles.clear}
                  onClick={() => {
                    onSelect("");
                    requestAnimationFrame(() =>
                      triggerRef.current?.focus({ preventScroll: true })
                    );
                  }}
                  type="button"
                  variant="ghost"
                >
                  <Trash2 aria-hidden="true" size={16} />
                  {text.remove}
                </Button>
              </div>
              <div className={styles.facts}>
                <DealerVehicleFacts
                  facts={getVehicleCardSpecFacts(
                    selectedVehicle.filterData,
                    locale
                  )}
                  label={text.specifications}
                />
              </div>
              <p className={styles.vehiclePrice}>
                {selectedVehicle.priceLabel}
              </p>
            </div>
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
              <span aria-hidden="true" className={styles.triggerIcon}>
                <Image
                  alt=""
                  draggable={false}
                  height={72}
                  src={getDealerVehicleTypeArtwork("car")}
                  unoptimized
                  width={132}
                />
              </span>
              <span className={styles.triggerCopy}>
                <strong data-slot="lease-desktop-empty-title">
                  {copy.vehicleLabel}
                </strong>
                <span className={styles.triggerHint}>{text.chooseHint}</span>
              </span>
              <span aria-hidden="true" className={styles.caret}>
                <ChevronRight size={20} />
              </span>
            </button>
          </DialogTrigger>
        )}
      </div>
      <DialogContent
        className={`${overlayStyles.dialog} ${styles.dialog}`}
        data-slot="lease-desktop-vehicle-dialog"
        showCloseButton={false}
      >
        <DialogHeader className={overlayStyles.header}>
          <DialogTitle>{copy.searchTitle}</DialogTitle>
          <DialogDescription className="sr-only">
            {text.description}
          </DialogDescription>
          <DialogClose asChild>
            <button
              aria-label={
                locale === "bg" ? "Затвори избора" : "Close vehicle selection"
              }
              className={overlayStyles.close}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </DialogClose>
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
      </DialogContent>
    </Dialog>
  );
}
