export type ListingShareOutcome = "copied" | "shared";

const listingShareTimeoutMs = 2500;

interface ListingShareNavigator {
  clipboard: Pick<Clipboard, "writeText">;
  share?: (data?: ShareData) => Promise<void>;
}

export const getListingActionCopy = (locale?: string) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;

  return {
    isBg,
    print: isBg ? "Печат / PDF" : "Print / PDF",
    save: isBg
      ? "Отвори профила, за да запазиш обявата"
      : "Open your account to save this listing",
    share: isBg ? "Сподели обявата" : "Share listing",
    shareStatus: isBg
      ? {
          cancelled: "Споделянето е отменено.",
          copied: "Връзката към обявата е копирана.",
          failed: "Обявата не можа да бъде споделена.",
          pending: "Отваряне на споделянето…",
          shared: "Обявата е споделена.",
        }
      : {
          cancelled: "Sharing cancelled.",
          copied: "Listing link copied.",
          failed: "Could not share this listing.",
          pending: "Opening share…",
          shared: "Listing shared.",
        },
  } as const;
};

export const shareListing = async (
  listingTitle: string,
  listingUrl: string,
  navigatorApi: ListingShareNavigator = navigator
): Promise<ListingShareOutcome> => {
  if (navigatorApi.share) {
    try {
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("Native share timed out"));
          }
        }, listingShareTimeoutMs);

        navigatorApi.share?.({ title: listingTitle, url: listingUrl }).then(
          () => {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timeoutId);
            resolve();
          },
          (error: unknown) => {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timeoutId);
            reject(error);
          }
        );
      });
      return "shared";
    } catch (error) {
      if (isListingShareCancellation(error)) {
        throw error;
      }
    }
  }

  await navigatorApi.clipboard.writeText(listingUrl);
  return "copied";
};

export const isListingShareCancellation = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";
