import type { VehicleListing } from "@repo/marketplace";

export const formatSellerPanelPublishedDate = (value: string, locale?: string) =>
  new Intl.DateTimeFormat(locale?.startsWith("bg") ? "bg-BG" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export const getSellerPanelCopy = ({
  defaultContactLabel,
  locale,
}: {
  defaultContactLabel: string;
  locale?: string;
}) => {
  if (!locale?.toLowerCase().startsWith("bg")) {
    return {
      basedIn: "Seller based in",
      confirmed: "confirmed",
      contact: defaultContactLabel,
      contactUnavailableHint:
        "The seller is not accepting enquiries right now.",
      costAfterDelivery: "Cost after delivery",
      delivery: "Delivery",
      documentation: "Documentation",
      documentsListed: (count: number) =>
        `document${count === 1 ? "" : "s"} listed`,
      inventorySource: "Inventory source",
      financeOffer: "Finance offer",
      leaseOffer: "Lease offer",
      month: "mo",
      purchase: "Purchase",
      published: "Published",
      privateSeller: "Private seller",
      reportListing: "Report listing",
      seller: "Seller",
      viewSellerProfile: "View seller and all listings",
      vehicleReference: "Vehicle reference",
      viewFinancing: "View financing",
    } as const;
  }

  return {
    basedIn: "Базиран в",
    confirmed: "потвърдено",
    contact: defaultContactLabel,
    contactUnavailableHint: "Продавачът не приема запитвания в момента.",
    costAfterDelivery: "Крайна цена с доставка",
    delivery: "Доставка",
    documentation: "Документи",
    documentsListed: (_count: number) => "посочени документа",
    inventorySource: "Източник",
    financeOffer: "Финансиране",
    leaseOffer: "Лизингова оферта",
    month: "мес.",
    purchase: "Покупка",
    published: "Публикувана",
    privateSeller: "Частен продавач",
    reportListing: "Докладвай обявата",
    seller: "Продавач",
    viewSellerProfile: "Виж продавача и всички обяви",
    vehicleReference: "Номер на обявата",
    viewFinancing: "Виж финансиране",
  } as const;
};

export type SellerPanelCopy = ReturnType<typeof getSellerPanelCopy>;

export const getSellerPanelDisplayName = (
  listing: VehicleListing,
  copy: SellerPanelCopy
) =>
  listing.seller.type === "private" &&
  listing.seller.displayName.toLowerCase() === "private seller"
    ? copy.privateSeller
    : listing.seller.displayName;

export const getSellerPanelContactLabel = ({
  contactHref,
  fallback,
  locale,
}: {
  contactHref?: string;
  fallback: string;
  locale?: string;
}) => {
  if (!contactHref?.startsWith("tel:")) {
    return fallback;
  }

  return locale?.toLowerCase().startsWith("bg") ? "Обадете се" : "Call dealer";
};

export const getSellerPanelTransactionLabel = (
  priceType: VehicleListing["priceType"],
  copy: SellerPanelCopy
) =>
  ({
    finance_estimate: copy.financeOffer,
    fixed: copy.purchase,
    lease_monthly: copy.leaseOffer,
    negotiable: copy.purchase,
  })[priceType];

export const isMonthlySellerPanelTransaction = (
  priceType: VehicleListing["priceType"]
) => priceType === "lease_monthly" || priceType === "finance_estimate";
