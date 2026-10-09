import { publicSite } from "@repo/marketplace/site-config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDesktopSavedCarsStorageKey,
  legacyDesktopSavedCarsStorageKey,
} from "./desktop-saved-car";

const storageKey = getDesktopSavedCarsStorageKey(publicSite.identity.slug);
const car = {
  id: "test-car",
  title: "Test vehicle",
  href: "/bg/listing/test-car",
  image: "",
  price: "100 EUR",
};
const values = new Map<string, string>();
const storage = {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    values.set(key, value);
  }),
};
let browser: EventTarget;

beforeEach(() => {
  vi.resetModules();
  values.clear();
  storage.getItem
    .mockReset()
    .mockImplementation((key) => values.get(key) ?? null);
  storage.setItem.mockReset().mockImplementation((key, value) => {
    values.set(key, value);
  });
  browser = new EventTarget();
  vi.stubGlobal("window", browser);
  vi.stubGlobal("localStorage", storage);
});
afterEach(() => vi.unstubAllGlobals());

const loadStore = async () =>
  (await import("./desktop-saved-cars-store")).desktopSavedCarsStore;
const dispatchStorage = (key: string | null) => {
  browser.dispatchEvent(Object.assign(new Event("storage"), { key }));
};

describe("desktop shortlist state", () => {
  it("keeps a stable empty server snapshot without accessing browser storage", async () => {
    vi.stubGlobal("window", undefined);
    const store = await loadStore();
    expect(store.getServerSnapshot()).toEqual([]);
    expect(store.getSnapshot()).toBe(store.getServerSnapshot());
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
    expect(storage.getItem).not.toHaveBeenCalled();
  });

  it("loads once and preserves snapshot identity between changes", async () => {
    values.set(storageKey, JSON.stringify([car]));
    const store = await loadStore();
    const snapshot = store.getSnapshot();
    expect(snapshot).toEqual([car]);
    expect(store.getSnapshot()).toBe(snapshot);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it("toggles and notifies all subscribers while keeping the server snapshot empty", async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.toggleCar(car);
    expect(store.getSnapshot()).toEqual([car]);
    expect(JSON.parse(values.get(storageKey) ?? "[]")).toEqual([car]);
    store.toggleCar(car);
    expect(store.getSnapshot()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getServerSnapshot()).toEqual([]);
    unsubscribe();
  });

  it("retains the shortlist for the current visit when storage is denied", async () => {
    storage.getItem.mockImplementation(() => {
      throw new Error("Denied");
    });
    storage.setItem.mockImplementation(() => {
      throw new Error("Quota");
    });
    const store = await loadStore();
    expect(store.getSnapshot()).toEqual([]);
    expect(() => store.toggleCar(car)).not.toThrow();
    expect(store.getSnapshot()).toEqual([car]);
  });

  it("responds to this site's cross-tab changes and storage.clear, not another dealer", async () => {
    const store = await loadStore();
    store.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    values.set(storageKey, JSON.stringify([car]));
    dispatchStorage("another-dealer-key");
    expect(listener).not.toHaveBeenCalled();
    dispatchStorage(storageKey);
    expect(store.getSnapshot()).toEqual([car]);
    values.clear();
    dispatchStorage(null);
    expect(store.getSnapshot()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    dispatchStorage(storageKey);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("prefers scoped records to master-preview legacy storage", async () => {
    values.set(storageKey, "[]");
    values.set(legacyDesktopSavedCarsStorageKey, JSON.stringify([car]));
    const store = await loadStore();
    expect(store.getSnapshot()).toEqual([]);
  });

  it("caps the shortlist and discards corrupt persisted records", async () => {
    values.set(storageKey, "invalid JSON");
    const store = await loadStore();
    expect(store.getSnapshot()).toEqual([]);
    for (let index = 0; index < 105; index++) {
      store.toggleCar({ ...car, id: String(index) });
    }
    expect(store.getSnapshot()).toHaveLength(100);
    expect(store.getSnapshot()[0]?.id).toBe("5");
  });
});

describe("shortlist reconciliation", () => {
  it("refreshes changes made while no component was subscribed", async () => {
    const store = await loadStore();
    store.getSnapshot();
    store.subscribe(vi.fn())();
    values.set(storageKey, JSON.stringify([car]));
    const unsubscribe = store.subscribe(vi.fn());
    expect(store.getSnapshot()).toEqual([car]);
    unsubscribe();
  });

  it("merges a local toggle with the latest stored shortlist", async () => {
    const store = await loadStore();
    store.getSnapshot();
    values.set(storageKey, JSON.stringify([car]));
    const secondCar = { ...car, id: "second-car" };
    store.toggleCar(secondCar);
    expect(store.getSnapshot()).toEqual([car, secondCar]);
    expect(JSON.parse(values.get(storageKey) ?? "[]")).toEqual([
      car,
      secondCar,
    ]);
  });

  it("does not re-render consumers for an unchanged storage event", async () => {
    values.set(storageKey, JSON.stringify([car]));
    const store = await loadStore();
    const snapshot = store.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    dispatchStorage(storageKey);
    expect(store.getSnapshot()).toBe(snapshot);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("keeps visit-only saves when persistence is full and storage has not changed", async () => {
    const store = await loadStore();
    const unsubscribe = store.subscribe(vi.fn());
    storage.setItem.mockImplementation(() => {
      throw new Error("Quota");
    });
    store.toggleCar(car);
    dispatchStorage(storageKey);
    expect(store.getSnapshot()).toEqual([car]);
    unsubscribe();
  });

  it("keeps the current shortlist when a later storage read fails", async () => {
    const store = await loadStore();
    const unsubscribe = store.subscribe(vi.fn());
    store.toggleCar(car);
    storage.getItem.mockImplementation(() => {
      throw new Error("Denied");
    });
    dispatchStorage(storageKey);
    expect(store.getSnapshot()).toEqual([car]);
    unsubscribe();
  });
});
