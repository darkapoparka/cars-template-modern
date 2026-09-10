import { describe, expect, it, vi } from "vitest";
import { getListingActionCopy, shareListing } from "./listing-action-policy";

describe("listing action policy", () => {
  it("localizes labels without coupling copy to the component", () => {
    expect(getListingActionCopy("bg").print).toBe("Печат / PDF");
    expect(getListingActionCopy("en").share).toBe("Share listing");
  });

  it("prefers the native share API when it is available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(
      shareListing("BMW X5", "https://example.com/x5", {
        clipboard: { writeText } as unknown as Clipboard,
        share,
      })
    ).resolves.toBe("shared");

    expect(share).toHaveBeenCalledWith({
      title: "BMW X5",
      url: "https://example.com/x5",
    });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to copying the listing URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(
      shareListing("BMW X5", "https://example.com/x5", {
        clipboard: { writeText } as unknown as Clipboard,
        share: undefined,
      })
    ).resolves.toBe("copied");

    expect(writeText).toHaveBeenCalledWith("https://example.com/x5");
  });

  it("falls back to copying when native share does not respond", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const share = vi.fn(
      () =>
        new Promise<void>(() => {
          // Keep the native share pending to exercise the fallback timeout.
        })
    );

    const outcome = shareListing("BMW X5", "https://example.com/x5", {
      clipboard: { writeText } as unknown as Clipboard,
      share,
    });

    await vi.advanceTimersByTimeAsync(2500);

    await expect(outcome).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://example.com/x5");
    vi.useRealTimers();
  });
});
