import { publicBasePath } from "@repo/internationalization/paths";
import { publicSite } from "@repo/marketplace/site-config";
import {
  type DesktopSavedCar,
  getDesktopSavedCarsStorageKey,
  legacyDesktopSavedCarsStorageKey,
  parseDesktopSavedCars,
} from "./desktop-saved-car";

/** Shortlist persistence and subscriptions; independent of its rendering. */
const storageKey = getDesktopSavedCarsStorageKey(publicSite.identity.slug);
const canReadLegacyStorage =
  Boolean(publicSite.identity.desktopPreview) && !publicBasePath;
const empty: DesktopSavedCar[] = [];
let snapshot = empty;
let initialized = false;
let lastStoredValue: string | null | undefined;
const listeners = new Set<() => void>();

function refreshSnapshot() {
  const previous = snapshot;
  try {
    const stored = localStorage.getItem(storageKey);
    const serialized =
      stored ??
      (canReadLegacyStorage
        ? localStorage.getItem(legacyDesktopSavedCarsStorageKey)
        : null);
    if (serialized !== lastStoredValue) {
      lastStoredValue = serialized;
      const next = parseDesktopSavedCars(serialized);
      if (JSON.stringify(next) !== JSON.stringify(snapshot)) {
        snapshot = next;
      }
    }
  } catch {
    // A failed read must not discard this visit's in-memory shortlist.
  }
  return snapshot !== previous;
}

function getSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    refreshSnapshot();
    initialized = true;
  }
  return snapshot;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function onStorage(event: StorageEvent) {
  const relevant =
    event.key === storageKey ||
    event.key === null ||
    (canReadLegacyStorage && event.key === legacyDesktopSavedCarsStorageKey);
  if (relevant && refreshSnapshot()) {
    notify();
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    // Changes can arrive while no shortlist component is mounted.
    refreshSnapshot();
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
  // Reconcile a pending cross-tab write before applying this local action.
  refreshSnapshot();
  initialized = true;
  snapshot = snapshot.some((item) => item.id === car.id)
    ? snapshot.filter((item) => item.id !== car.id)
    : [...snapshot, car].slice(-100);
  try {
    const serialized = JSON.stringify(snapshot);
    localStorage.setItem(storageKey, serialized);
    lastStoredValue = serialized;
  } catch {
    // The shortlist remains available for this visit when persistence fails.
  }
  notify();
}

export const desktopSavedCarsStore = {
  getSnapshot,
  getServerSnapshot: () => empty,
  subscribe,
  toggleCar,
} as const;
