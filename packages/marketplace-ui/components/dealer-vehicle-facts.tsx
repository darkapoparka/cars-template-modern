export function DealerVehicleFacts({
  facts,
  label,
}: {
  readonly facts: readonly {
    id: string;
    value: string;
    displayValue?: string;
    mobileDisplayValue?: string;
    mobileMediumDisplayValue?: string;
  }[];
  readonly label: string;
}) {
  return (
    <>
      <div className="@container/vehicle-facts lg:hidden">
        <ul
          aria-label={label}
          className="flex gap-1 text-micro text-secondary-foreground min-[360px]:text-card-spec"
          data-slot="vehicle-card-spec-pills"
        >
          {facts.map((fact) => (
            <li
              className="flex min-h-6 shrink-0 items-center justify-center rounded-md border border-border/40 bg-secondary px-1.5 py-0.5 font-normal tabular-nums"
              data-fact={fact.id}
              data-slot="vehicle-card-spec"
              key={fact.id}
              title={fact.value}
            >
              <span
                aria-hidden={
                  fact.mobileDisplayValue || fact.displayValue
                    ? true
                    : undefined
                }
                className="whitespace-nowrap"
              >
                {fact.mobileMediumDisplayValue ? (
                  <>
                    <span className="@min-[280px]/vehicle-facts:hidden">
                      {fact.mobileDisplayValue}
                    </span>
                    <span className="@min-[280px]/vehicle-facts:inline @min-[310px]/vehicle-facts:hidden hidden">
                      {fact.mobileMediumDisplayValue}
                    </span>
                    <span className="@min-[310px]/vehicle-facts:inline hidden">
                      {fact.value}
                    </span>
                  </>
                ) : (
                  (fact.mobileDisplayValue ?? fact.displayValue ?? fact.value)
                )}
              </span>
              {fact.mobileDisplayValue || fact.displayValue ? (
                <span className="sr-only">{fact.value}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden lg:contents">
        <ul
          aria-label={label}
          className="grid grid-cols-2 items-center gap-1 text-meta text-secondary-foreground"
          data-slot="vehicle-card-spec-pills"
        >
          {facts.map((fact) => (
            <li
              aria-label={fact.displayValue ? fact.value : undefined}
              className="flex min-h-7 min-w-0 max-w-full items-center justify-self-stretch rounded-md border border-border/40 bg-secondary px-2 py-1 font-medium tabular-nums"
              data-slot="vehicle-card-spec"
              key={fact.id}
              title={fact.value}
            >
              <span
                aria-hidden={fact.displayValue ? true : undefined}
                className={
                  fact.id === "year" || fact.id === "mileage"
                    ? "whitespace-nowrap"
                    : "min-w-0 break-words"
                }
              >
                {fact.displayValue ?? fact.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
