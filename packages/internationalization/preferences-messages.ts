import type { Locale } from "./config";

export const en = {
  "locale.title": "Country and language",
  "locale.welcome": "Welcome to {dealer}",
  "locale.description":
    "Choose your browsing preferences. You can change them at any time.",
  "locale.country": "Your country or region",
  "locale.language": "Website language",
  "locale.suggested": "Suggested",
  "locale.suggestion": "Suggested region: {country}",
  "locale.save": "Save preferences",
  "locale.dismiss": "Not now",
  "locale.close": "Close country and language preferences",
  "locale.saving": "Saving…",
  "locale.error": "Your preferences could not be saved. Please try again.",
  "locale.facts":
    "The dealership remains in {country}. Vehicle prices keep their original {currency} currency.",
  "locale.trigger": "Country and language",
  "locale.back": "Back to the website",
  "locale.unsupported": "This language is not available",
  "form.required": "Please complete this field.",
  "form.email": "Enter a valid email address.",
  "form.invalid": "Please check this value.",
  "form.minimum": "Enter a value of at least {min}.",
  "form.maximum": "Enter a value no greater than {max}.",
  "form.tooShort": "Enter at least {min} characters.",
  "form.tooLong": "Use no more than {max} characters.",
} as const;
export type PreferenceMessages = { readonly [K in keyof typeof en]: string };
export const bg = {
  "locale.title": "Държава и език",
  "locale.welcome": "Добре дошли в {dealer}",
  "locale.description":
    "Изберете предпочитанията си за разглеждане. Можете да ги промените по всяко време.",
  "locale.country": "Вашата държава или регион",
  "locale.language": "Език на сайта",
  "locale.suggested": "Предложение",
  "locale.suggestion": "Предложен регион: {country}",
  "locale.save": "Запазете предпочитанията",
  "locale.dismiss": "Не сега",
  "locale.close": "Затворете избора на държава и език",
  "locale.saving": "Запазване…",
  "locale.error": "Предпочитанията не бяха запазени. Опитайте отново.",
  "locale.facts":
    "Автокъщата остава в {country}. Цените запазват първоначалната си валута {currency}.",
  "locale.trigger": "Държава и език",
  "locale.back": "Обратно към сайта",
  "locale.unsupported": "Този език не е наличен",
  "form.required": "Моля, попълнете това поле.",
  "form.email": "Въведете валиден имейл адрес.",
  "form.invalid": "Проверете тази стойност.",
  "form.minimum": "Въведете стойност поне {min}.",
  "form.maximum": "Въведете стойност не по-голяма от {max}.",
  "form.tooShort": "Въведете поне {min} знака.",
  "form.tooLong": "Използвайте не повече от {max} знака.",
} satisfies PreferenceMessages;
export const getPreferenceMessages = (locale: Locale): PreferenceMessages =>
  locale === "bg" ? bg : en;
