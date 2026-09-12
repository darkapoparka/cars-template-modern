export function DealerVehicleFacts({
  facts,
  label,
}: {
  readonly facts: readonly { id: string; value: string }[];
  readonly label: string;
}) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-2 gap-1 text-[10.5px] text-secondary-foreground leading-[14px] min-[360px]:text-[11px] min-[360px]:leading-4"
      data-slot="vehicle-card-spec-pills"
    >
      {facts.map((fact) => (
        <li
          className="flex min-h-[22px] min-w-0 items-center rounded-md border border-border/40 bg-secondary px-1 py-0.5 font-medium tabular-nums lg:px-2 min-[360px]:min-h-6 min-[360px]:px-1.5"
          key={fact.id}
          title={fact.value}
        >
          <span>{fact.value}</span>
        </li>
      ))}
    </ul>
  );
}
