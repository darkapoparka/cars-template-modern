import { formatMoneyParts, type Money } from "@repo/marketplace";

/** Keep the full localized price, with a quieter currency on mobile. */
export function VehicleCardMoney({
  money,
  locale,
}: {
  money: Money;
  locale?: string;
}) {
  const parts = formatMoneyParts(money, locale);
  const currencyIndex = parts.findIndex(({ type }) => type === "currency");
  const join = (values: Intl.NumberFormatPart[]) =>
    values.map(({ value }) => value).join("");

  return (
    <>
      {join(parts.slice(0, currencyIndex))}
      <span className="max-lg:font-medium max-lg:text-meta max-lg:text-muted-foreground">
        {parts[currencyIndex]?.value}
      </span>
      {join(parts.slice(currencyIndex + 1))}
    </>
  );
}
