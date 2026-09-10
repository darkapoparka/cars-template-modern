const controlCharactersPattern =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const htmlBracketPattern = /[<>]/g;
const repeatedWhitespacePattern = /\s+/g;
const supportedImageProtocolPattern = /^https?:$/;

export const sanitizePlainText = (
  value: string | undefined,
  maximumLength: number
) =>
  value
    ?.normalize("NFKC")
    .replace(controlCharactersPattern, " ")
    .replace(htmlBracketPattern, "")
    .replace(repeatedWhitespacePattern, " ")
    .trim()
    .slice(0, maximumLength);

export const sanitizeImageUrls = (
  values: readonly string[] | undefined,
  maximumCount: number
) =>
  (values ?? [])
    .flatMap((value) => {
      try {
        const url = new URL(value);
        return supportedImageProtocolPattern.test(url.protocol)
          ? [url.toString()]
          : [];
      } catch {
        return [];
      }
    })
    .slice(0, maximumCount);

export const redactVin = (vin: string | undefined) =>
  vin ? `***${vin.slice(-4)}` : undefined;
