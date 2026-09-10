import { describe, expect, it } from "vitest";
import { getAnalyticsConsentCopy } from "./consent-copy";

describe("analytics consent copy", () => {
  it("returns Bulgarian copy for Bulgarian locale variants", () => {
    expect(getAnalyticsConsentCopy("bg").accept).toBe("Приемам");
    expect(getAnalyticsConsentCopy("bg-BG").privacy).toBe("Поверителност");
    expect(getAnalyticsConsentCopy("bg").manage).toBe(
      "Настройки за поверителност"
    );
  });

  it("defaults to English copy", () => {
    expect(getAnalyticsConsentCopy("en").accept).toBe("Accept");
    expect(getAnalyticsConsentCopy("en").manage).toBe("Privacy preferences");
    expect(getAnalyticsConsentCopy()).toEqual(getAnalyticsConsentCopy("en"));
  });
});
