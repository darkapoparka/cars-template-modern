import {
  promotionProductCatalog as domainPromotionProductCatalog,
  getPromotionCatalogProduct as getDomainPromotionCatalogProduct,
  type PromotionPaymentStatus,
} from "@repo/marketplace/commerce";

type PromotionPlacementKey =
  | "category_featured"
  | "lease_partner"
  | "search_top";

type PromotionStatusKey =
  | "active"
  | "canceled"
  | "ended"
  | "failed"
  | "paused"
  | "payment_pending"
  | "refunded"
  | "scheduled";

interface PromotionCatalogProduct {
  readonly description: string;
  readonly disclosureLabel: string;
  readonly durationDays: number;
  readonly id: string;
  readonly label: string;
  readonly placement: PromotionPlacementKey;
}

const localizePromotionProduct = (
  product: (typeof domainPromotionProductCatalog)[number]
): PromotionCatalogProduct => ({
  description: product.description.bg,
  disclosureLabel: product.disclosureLabel.bg,
  durationDays: product.durationDays,
  id: product.id,
  label: product.label.bg,
  placement: product.placement,
});

export const promotionProductCatalog: readonly PromotionCatalogProduct[] =
  domainPromotionProductCatalog.map(localizePromotionProduct);

const promotionPlacementLabels: Readonly<
  Record<PromotionPlacementKey, string>
> = {
  category_featured: "Препоръчана в категория",
  lease_partner: "Позиция при лизингов партньор",
  search_top: "Водеща позиция в търсенето",
};

const promotionStatusLabels: Readonly<Record<PromotionStatusKey, string>> = {
  active: "Активна",
  canceled: "Отказана",
  ended: "Приключила",
  failed: "Неуспешна",
  paused: "Поставена на пауза",
  payment_pending: "Плащането не е потвърдено",
  refunded: "Възстановена",
  scheduled: "Предстояща",
};

export const getPromotionCatalogProduct = (
  productId?: string
): PromotionCatalogProduct | undefined => {
  const product = getDomainPromotionCatalogProduct(productId);
  return product ? localizePromotionProduct(product) : undefined;
};

export const getPromotionPlacementLabel = (placement: string): string =>
  promotionPlacementLabels[placement as PromotionPlacementKey] ??
  "Платено позициониране";

export const getPromotionProductLabel = (
  productKey: string,
  placement: string
): string =>
  getPromotionCatalogProduct(productKey)?.label ??
  getPromotionPlacementLabel(placement);

export const getEffectivePromotionStatus = (
  status: string,
  paymentStatus: PromotionPaymentStatus,
  startsAt: Date,
  endsAt: Date,
  now = new Date()
): PromotionStatusKey => {
  if (status === "canceled" || status === "ended" || status === "paused") {
    return status;
  }
  if (endsAt.getTime() <= now.getTime()) {
    return "ended";
  }
  if (paymentStatus === "refunded") {
    return "refunded";
  }
  if (paymentStatus === "failed" || paymentStatus === "canceled") {
    return "failed";
  }
  if (
    !["paid", "included_credit"].includes(paymentStatus) &&
    startsAt.getTime() <= now.getTime()
  ) {
    return "payment_pending";
  }
  if (startsAt.getTime() > now.getTime()) {
    return "scheduled";
  }
  return status === "active" ? "active" : "scheduled";
};

export const getPromotionStatusLabel = (status: PromotionStatusKey): string =>
  promotionStatusLabels[status];
