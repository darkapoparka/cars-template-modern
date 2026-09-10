export interface AnalyticsConsentCopy {
  accept: string;
  ariaLabel: string;
  close: string;
  decline: string;
  description: string;
  manage: string;
  privacy: string;
  statusDenied: string;
  statusGranted: string;
  title: string;
}

const consentCopy = {
  bg: {
    accept: "Приемам",
    ariaLabel: "Настройки за анализи",
    close: "Затвори",
    decline: "Отказ",
    description:
      "Помогнете ни да подобрим AutoMarket. Нищо не се зарежда без вашето съгласие.",
    manage: "Настройки за поверителност",
    privacy: "Поверителност",
    statusDenied: "Незадължителните анализи са изключени.",
    statusGranted: "Незадължителните анализи са включени.",
    title: "Незадължителни анализи",
  },
  en: {
    accept: "Accept",
    ariaLabel: "Analytics preferences",
    close: "Close",
    decline: "Decline",
    description: "Help us improve AutoMarket. Nothing loads unless you accept.",
    manage: "Privacy preferences",
    privacy: "Privacy",
    statusDenied: "Optional analytics are off.",
    statusGranted: "Optional analytics are on.",
    title: "Optional analytics",
  },
} as const satisfies Record<"bg" | "en", AnalyticsConsentCopy>;

export const getAnalyticsConsentCopy = (
  locale?: string
): AnalyticsConsentCopy =>
  locale?.trim().toLowerCase().startsWith("bg")
    ? consentCopy.bg
    : consentCopy.en;
