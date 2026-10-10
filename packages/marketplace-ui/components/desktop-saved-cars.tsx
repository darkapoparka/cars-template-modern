"use client";

import { cn } from "@repo/design-system/lib/utils";
import { Bookmark, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { DesktopSavedCar } from "../lib/desktop-saved-car";
import { desktopSavedCarsStore } from "../lib/desktop-saved-cars-store";
import { getLocalizedPublicPath } from "../lib/public-path";
import { formatVehicleCardMoney } from "../lib/vehicle-card-policy";
import overlayStyles from "./desktop-overlay.module.css";
import styles from "./desktop-saved-cars.module.css";
import Image from "./public-image";

function useSavedCars() {
  return useSyncExternalStore(
    desktopSavedCarsStore.subscribe,
    desktopSavedCarsStore.getSnapshot,
    desktopSavedCarsStore.getServerSnapshot
  );
}

/** Boxcar's bookmark action, isolated from the existing mobile card and account routes. */
export function DesktopSaveCarButton({
  car,
  locale,
  presentation = "bookmark",
  showTooltip = false,
}: {
  car: DesktopSavedCar;
  locale?: string;
  presentation?: "bookmark" | "action";
  showTooltip?: boolean;
}) {
  const saved = useSavedCars().some((savedCar) => savedCar.id === car.id);
  const isBg = locale?.startsWith("bg");
  const saveLabel = isBg ? "Запази" : "Save";
  const removeLabel = isBg ? "Премахни" : "Unsave";
  const savedLabel = isBg ? "Запазен" : "Saved";
  const actionLabel = saved ? removeLabel : saveLabel;
  return (
    <button
      aria-label={`${actionLabel} ${car.title}`}
      aria-pressed={saved}
      className={styles.bookmark}
      data-presentation={presentation}
      data-slot="desktop-save-car"
      onClick={() => desktopSavedCarsStore.toggleCar(car)}
      title={showTooltip ? actionLabel : undefined}
      type="button"
    >
      <Bookmark aria-hidden fill={saved ? "currentColor" : "none"} size={18} />
      {presentation === "action" ? (
        <span>{saved ? savedLabel : saveLabel}</span>
      ) : null}
    </button>
  );
}

export function DesktopSavedCars({
  className,
  locale,
}: {
  className?: string;
  locale?: string;
}) {
  const saved = useSavedCars();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const isBg = locale?.startsWith("bg");
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const shortlist = dialog.current;
    const closeOnMobile = () => {
      if (!desktop.matches) {
        dialog.current?.close();
      }
    };
    // A native dialog already supports Escape and the keyboard-operated close button.
    // Backdrop clicks target the dialog but land outside its visible bounds.
    const closeOnBackdrop = (event: MouseEvent) => {
      if (!shortlist || event.target !== shortlist) {
        return;
      }
      const bounds = shortlist.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        shortlist.close();
      }
    };
    desktop.addEventListener("change", closeOnMobile);
    shortlist?.addEventListener("click", closeOnBackdrop);
    return () => {
      desktop.removeEventListener("change", closeOnMobile);
      shortlist?.removeEventListener("click", closeOnBackdrop);
    };
  }, []);
  return (
    <>
      <button
        aria-haspopup="dialog"
        className={cn(styles.saved, className)}
        data-slot="desktop-saved-cars"
        onClick={() => dialog.current?.showModal()}
        ref={opener}
        type="button"
      >
        <Bookmark aria-hidden size={18} />
        <span>
          {isBg ? "Запазени" : "Saved"}
          {saved.length > 0 ? ` (${saved.length})` : ""}
        </span>
      </button>
      <dialog
        aria-labelledby={titleId}
        className={cn(styles.dialog, overlayStyles.dialog)}
        data-empty={saved.length === 0}
        data-slot="desktop-saved-cars-dialog"
        onClose={() => {
          if (window.matchMedia("(min-width: 1024px)").matches) {
            opener.current?.focus();
          }
        }}
        ref={dialog}
      >
        <div className={overlayStyles.header}>
          <h2 id={titleId}>{isBg ? "Запазени автомобили" : "Saved cars"}</h2>
          <button
            aria-label={isBg ? "Затвори" : "Close saved cars"}
            className={overlayStyles.close}
            onClick={() => dialog.current?.close()}
            type="button"
          >
            <X aria-hidden size={22} />
          </button>
        </div>
        {saved.length === 0 ? (
          <p className={styles.empty}>
            {isBg
              ? "Запазете автомобил с отметката върху снимката, за да го намерите тук."
              : "Bookmark a car to keep your shortlist here."}
          </p>
        ) : (
          <div className={styles.grid}>
            {saved.map((car) => (
              <article key={car.id}>
                <Link
                  href={getLocalizedPublicPath(locale, car.href)}
                  onClick={() => dialog.current?.close()}
                >
                  {car.image && (
                    <Image alt="" height={280} src={car.image} width={420} />
                  )}
                  <h3>{car.title}</h3>
                  <p>
                    {car.money
                      ? formatVehicleCardMoney(car.money, "comparison", locale)
                      : car.price}
                  </p>
                </Link>
                <button
                  aria-label={`${isBg ? "Премахни" : "Remove"}: ${car.title}`}
                  onClick={() => desktopSavedCarsStore.toggleCar(car)}
                  type="button"
                >
                  {isBg ? "Премахни" : "Remove"}
                </button>
              </article>
            ))}
          </div>
        )}
      </dialog>
    </>
  );
}
