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
      className="grid grid-cols-2 gap-1 text-[11px] text-secondary-foreground leading-4"
      data-slot="vehicle-card-spec-pills"
    >
      {facts.map((fact) => (
        <li
          className="flex min-h-6 min-w-0 items-center rounded-md border border-border/40 bg-secondary px-1.5 py-0.5 font-medium tabular-nums lg:px-2"
          key={fact.id}
          title={fact.value}
        >
          <span>{fact.value}</span>
        </li>
      ))}
    </ul>
  );
}
