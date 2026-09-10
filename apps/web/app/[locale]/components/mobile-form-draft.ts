export type MobileFormDraft = Readonly<Record<string, string>>;

export const readMobileFormDraft = (form: HTMLFormElement): MobileFormDraft =>
  Object.fromEntries(
    [...new FormData(form)].filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
