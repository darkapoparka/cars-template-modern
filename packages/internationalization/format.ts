import { getIntlLocale } from "./config";

export const formatNumber = (
  value: number,
  locale?: string | null,
  options?: Intl.NumberFormatOptions
): string =>
  new Intl.NumberFormat(getIntlLocale(locale), options).format(value);

export const formatCurrency = (
  value: number,
  currency: string,
  locale?: string | null,
  options?: Omit<Intl.NumberFormatOptions, "currency" | "style">
): string =>
  new Intl.NumberFormat(getIntlLocale(locale), {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
    ...options,
  }).format(value);

export const formatDate = (
  value: Date | number | string,
  locale?: string | null,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): string => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(date);
};
