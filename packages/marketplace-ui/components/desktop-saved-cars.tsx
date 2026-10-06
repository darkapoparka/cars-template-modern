"use client";

import { cn } from "@repo/design-system/lib/utils";
import { publicBasePath } from "@repo/internationalization/paths";
import { publicSite } from "@repo/marketplace/site-config";
import { Bookmark, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import {
  type DesktopSavedCar,
  getDesktopSavedCarsStorageKey,
  legacyDesktopSavedCarsStorageKey,
  parseDesktopSavedCars,
} from "../lib/desktop-saved-car";
import { getLocalizedPublicPath } from "../lib/public-path";
import { formatVehicleCardMoney } from "../lib/vehicle-card-policy";
import styles from "./desktop-saved-cars.module.css";
import Image from "./public-image";

const storageKey = getDesktopSavedCarsStorageKey(publicSite.identity.slug);
const canReadLegacyStorage =
  Boolean(publicSite.identity.desktopPreview) && !publicBasePath;
const empty: DesktopSavedCar[] = [];
let snapshot = empty;
let initialized = false;
const listeners = new Set<() => void>();
function readSavedCars() {
  try {
    const serialized = localStorage.getItem(storageKey);
    return parseDesktopSavedCars(
      serialized ??
        (canReadLegacyStorage
          ? localStorage.getItem(legacyDesktopSavedCarsStorageKey)
          : null)
    );
  } catch {
    return empty;
  }
}
function getSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    snapshot = readSavedCars();
    initialized = true;
  }
  return snapshot;
}
function onStorage(event: StorageEvent) {
  if (
    event.key === storageKey ||
    event.key === null ||
    (canReadLegacyStorage && event.key === legacyDesktopSavedCarsStorageKey)
  ) {
    snapshot = readSavedCars();
    for (const listener of listeners) {
      listener();
    }
  }
}
function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
    }
  };
}
function toggleCar(car: DesktopSavedCar) {
  const current = getSnapshot();
  snapshot = current.some((item) => item.id === car.id)
    ? current.filter((item) => item.id !== car.id)
    : [...current, car].slice(-100);
  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    /* The shortlist remains available for this visit. */
  }
  for (const listener of listeners) {
    listener();
  }
}
function useSavedCars() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty);
}

/** Boxcar's bookmark action, isolated from the existing mobile card and account routes. */
export function DesktopSaveCarButton({
  car,
  locale,
  presentation = "bookmark",
}: {
  car: DesktopSavedCar;
  locale?: string;
  presentation?: "bookmark" | "action";
}) {
  const saved = useSavedCars().some((savedCar) => savedCar.id === car.id);
  const isBg = locale?.startsWith("bg");
  const saveLabel = isBg ? "Запази" : "Save";
  const removeLabel = isBg ? "Премахни" : "Unsave";
  const savedLabel = isBg ? "Запазен" : "Saved";
  return (
    <button
      aria-label={`${saved ? removeLabel : saveLabel} ${car.title}`}
      aria-pressed={saved}
      className={styles.bookmark}
      data-presentation={presentation}
      data-slot="desktop-save-car"
      onClick={() => toggleCar(car)}
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
        className={styles.dialog}
        onClose={() => {
          if (window.matchMedia("(min-width: 1024px)").matches) {
            opener.current?.focus();
          }
        }}
        ref={dialog}
      >
        <div className={styles.heading}>
          <h2 id={titleId}>{isBg ? "Запазени автомобили" : "Saved cars"}</h2>
          <button
            aria-label={isBg ? "Затвори" : "Close saved cars"}
            onClick={() => dialog.current?.close()}
            type="button"
          >
            <X aria-hidden size={22} />
          </button>
        </div>
        {saved.length === 0 ? (
          <p>
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
                <button onClick={() => toggleCar(car)} type="button">
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
