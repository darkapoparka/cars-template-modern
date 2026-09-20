import { describe, expect, it } from "vitest";
import { getSellContactCopy, pageCopy } from "./copy";

describe("legacy trade-in entry copy", () => {
  it("does not pretend empty English vehicle details are ready", () => {
    const copy = getSellContactCopy("en", false);
    expect(copy.sellHandoffEditAction).toBe("Add vehicle details");
    expect(copy.sellHandoffDescription).toContain(
      "Nothing is sent automatically"
    );
    expect(copy.sellHandoffDescription).not.toContain("details are ready");
  });
  it("provides a native Bulgarian entry rather than mixed trade-in text", () => {
    const copy = getSellContactCopy("bg", false);
    expect(copy.sellHandoffTitle).toBe("Продайте или заменете автомобила си");
    expect(copy.sellHandoffDescription).toContain(
      "Нищо не се изпраща автоматично"
    );
  });
  it.each([
    "en",
    "bg",
  ] as const)("preserves the existing completed %s draft handoff", (locale) =>
    expect(getSellContactCopy(locale, true)).toBe(pageCopy[locale]));
});
