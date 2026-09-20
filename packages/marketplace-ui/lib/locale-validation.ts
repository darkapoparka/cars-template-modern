import type { PreferenceMessages } from "@repo/internationalization/preferences-messages";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Translate = (
  key: keyof PreferenceMessages,
  parameters?: Record<string, string | number>
) => string;
export const isPreferenceField = (field: EventTarget): field is Field =>
  field instanceof HTMLInputElement ||
  field instanceof HTMLTextAreaElement ||
  field instanceof HTMLSelectElement;
export function nativeValidationMessage(field: Field, t: Translate): string {
  if (field.validity.valueMissing) {
    return t("form.required");
  }
  if (field instanceof HTMLInputElement) {
    if (field.type === "email" && field.validity.typeMismatch) {
      return t("form.email");
    }
    if (field.validity.rangeUnderflow) {
      return t("form.minimum", { min: field.min });
    }
    if (field.validity.rangeOverflow) {
      return t("form.maximum", { max: field.max });
    }
  }
  if (!(field instanceof HTMLSelectElement)) {
    if (field.validity.tooShort) {
      return t("form.tooShort", { min: field.minLength });
    }
    if (field.validity.tooLong) {
      return t("form.tooLong", { max: field.maxLength });
    }
  }
  return t("form.invalid");
}
