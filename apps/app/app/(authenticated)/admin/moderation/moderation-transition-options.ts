export const moderationResolutionOptions = {
  dismissed: [
    { label: "Не е установено нарушение", value: "no_violation" },
    { label: "Недостатъчно доказателства", value: "insufficient_evidence" },
    { label: "Дублиран сигнал", value: "duplicate_report" },
  ],
  resolved: [
    { label: "Обявата е коригирана", value: "listing_corrected" },
    {
      label: "Нарушаващото съдържание е премахнато",
      value: "content_removed",
    },
    {
      label: "Предприето е действие спрямо продавача",
      value: "seller_action_taken",
    },
  ],
} as const;

export const dismissedResolutionCodes = [
  "no_violation",
  "insufficient_evidence",
  "duplicate_report",
] as const;

export const resolvedResolutionCodes = [
  "listing_corrected",
  "content_removed",
  "seller_action_taken",
] as const;

const resolutionLabels = new Map<string, string>(
  Object.values(moderationResolutionOptions)
    .flat()
    .map((option) => [option.value, option.label])
);

export const getModerationResolutionLabel = (resolutionCode: string | null) =>
  resolutionCode
    ? (resolutionLabels.get(resolutionCode) ?? "Друга записана причина")
    : "Без записана причина";
