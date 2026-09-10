import { afterEach, describe, expect, it, vi } from "vitest";

interface BrowserOptions {
  readonly getError?: boolean;
  readonly setError?: boolean;
  readonly stored?: string | null;
}

const installBrowser = ({
  getError = false,
  setError = false,
  stored = null,
}: BrowserOptions = {}) => {
  let value = stored;
  const dispatchEvent = vi.fn();
  const setItem = vi.fn((_key: string, nextValue: string) => {
    if (setError) {
      throw new DOMException("Storage blocked", "SecurityError");
    }
    value = nextValue;
  });
  const localStorage = {
    getItem: vi.fn(() => {
      if (getError) {
        throw new DOMException("Storage blocked", "SecurityError");
      }
      return value;
    }),
    setItem,
  };

  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    dispatchEvent,
    localStorage,
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("navigator", { doNotTrack: null });

  return { dispatchEvent, localStorage, setItem };
};

const loadConsent = () => {
  vi.resetModules();
  return import("./consent");
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("analytics consent contract", () => {
  it("uses stable product-owned names and a versioned record", async () => {
    const consent = await loadConsent();

    expect(consent.ANALYTICS_CONSENT_STORAGE_KEY).toBe(
      "automarket.analytics-consent"
    );
    expect(consent.ANALYTICS_CONSENT_EVENT).toBe(
      "automarket:analytics-consent"
    );
    expect(consent.ANALYTICS_CONSENT_VERSION).toBe(1);
  });

  it("reads a current valid consent record", async () => {
    installBrowser({
      stored: JSON.stringify({
        decision: "granted",
        updatedAt: "2026-07-16T10:00:00.000Z",
        version: 1,
      }),
    });
    const { getAnalyticsConsent } = await loadConsent();

    expect(getAnalyticsConsent()).toBe("granted");
  });

  it.each([
    "granted",
    "not-json",
    '{"decision":"granted","version":0}',
  ])("treats legacy or malformed storage as unknown: %s", async (stored) => {
    installBrowser({ stored });
    const { getAnalyticsConsent } = await loadConsent();

    expect(getAnalyticsConsent()).toBe("unknown");
  });

  it("fails safely when storage reads are blocked", async () => {
    installBrowser({ getError: true });
    const { getAnalyticsConsent } = await loadConsent();

    expect(getAnalyticsConsent()).toBe("unknown");
  });

  it("persists and announces a versioned decision", async () => {
    const browser = installBrowser();
    const consent = await loadConsent();

    consent.setAnalyticsConsent("denied");

    const stored = JSON.parse(browser.setItem.mock.calls[0]?.[1] ?? "null");
    expect(stored).toMatchObject({ decision: "denied", version: 1 });
    expect(Date.parse(stored.updatedAt)).not.toBeNaN();
    expect(browser.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(consent.getAnalyticsConsent()).toBe("denied");
  });

  it("keeps the current-page decision when storage writes are blocked", async () => {
    installBrowser({ setError: true });
    const consent = await loadConsent();

    expect(() => consent.setAnalyticsConsent("granted")).not.toThrow();
    expect(consent.getAnalyticsConsent()).toBe("granted");
  });

  it("honors Global Privacy Control over a stored grant", async () => {
    installBrowser({
      stored: JSON.stringify({
        decision: "granted",
        updatedAt: "2026-07-16T10:00:00.000Z",
        version: 1,
      }),
    });
    vi.stubGlobal("navigator", {
      doNotTrack: null,
      globalPrivacyControl: true,
    });
    const { getAnalyticsConsent } = await loadConsent();

    expect(getAnalyticsConsent()).toBe("denied");
  });
});
