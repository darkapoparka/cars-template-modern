import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readLocalPreference,
  writeLocalPreference,
} from "./browser-preferences";

afterEach(() => vi.unstubAllGlobals());

describe("optional browser preferences", () => {
  it("does not access browser state while rendering on the server", () => {
    vi.stubGlobal("window", undefined);
    expect(readLocalPreference("view")).toBeNull();
    expect(writeLocalPreference("view", "list")).toBe(false);
  });

  it("reads and persists the existing string values without reformatting them", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    expect(readLocalPreference("view")).toBeNull();
    expect(writeLocalPreference("view", "list")).toBe(true);
    expect(readLocalPreference("view")).toBe("list");
  });

  it("survives denial of the localStorage property itself", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("SecurityError: access denied");
      },
    });
    expect(readLocalPreference("view")).toBeNull();
    expect(writeLocalPreference("view", "list")).toBe(false);
  });

  it("survives read errors and quota failures without preventing local UI state", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("Storage unavailable");
        },
        setItem: () => {
          throw new Error("Quota exceeded");
        },
      },
    });
    expect(readLocalPreference("view")).toBeNull();
    expect(writeLocalPreference("view", "grid")).toBe(false);
  });
});
