export const buyerReportOptions = [
  {
    label: "Неверни данни за автомобила",
    severity: "low",
    value: "incorrect_details",
  },
  {
    label: "Подозрителен продавач",
    severity: "medium",
    value: "seller_behavior",
  },
  {
    label: "Дублирана обява",
    severity: "low",
    value: "duplicate",
  },
  {
    label: "Риск при плащане или контакт",
    severity: "high",
    value: "fraud_risk",
  },
  {
    label: "Забранено съдържание",
    severity: "medium",
    value: "prohibited_content",
  },
] as const;

export type BuyerReportReason = (typeof buyerReportOptions)[number]["value"];

export const getBuyerReportOption = (value: string) =>
  buyerReportOptions.find((option) => option.value === value);
