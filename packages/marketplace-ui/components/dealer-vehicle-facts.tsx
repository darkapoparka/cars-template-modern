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
      className="grid grid-cols-2 gap-1 text-meta text-secondary-foreground"
      data-slot="vehicle-card-spec-pills"
    >
      {facts.map((fact) => (
        <li
          className="flex min-h-7 min-w-0 items-center rounded-md border border-border/40 bg-secondary px-2 py-1 font-medium tabular-nums"
          key={fact.id}
          title={fact.value}
        >
          <span className="min-w-0 truncate">{fact.value}</span>
        </li>
      ))}
    </ul>
  );
}
