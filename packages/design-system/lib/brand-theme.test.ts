import { describe, expect, it } from "vitest";
import { brandContrastRatio, createBrandTheme } from "./brand-theme";

describe("brand theme pairs", () => {
  it.each([
    "#c40101",
    "#164e63",
    "#facc15",
    "#777777",
    "#76787a",
    "#ffffff",
    "#000000",
  ])("creates readable pairs for %s", (accent) => {
    const theme = createBrandTheme(accent);
    expect(
      brandContrastRatio(accent, theme["--brand-foreground"])
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      brandContrastRatio(theme["--brand-text"], "#ffffff")
    ).toBeGreaterThanOrEqual(4.5);
  });
  it("keeps every grayscale brand readable, including the mid-gray contrast gap", () => {
    for (let value = 0; value <= 255; value++) {
      const accent = `#${value.toString(16).padStart(2, "0").repeat(3)}`;
      const theme = createBrandTheme(accent);
      expect(
        brandContrastRatio(accent, theme["--brand-foreground"])
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("retains the accepted default mobile accent", () => {
    expect(createBrandTheme("#c40101")).toMatchObject({
      "--brand": "#c40101",
      "--brand-foreground": "#ffffff",
      "--brand-text": "#c40101",
    });
  });
  it.each([
    "red",
    "var(--external)",
    "#fff",
    "#fff;background:url(x)",
  ])("rejects arbitrary CSS: %s", (value) => {
    expect(() => createBrandTheme(value)).toThrow();
  });
});
