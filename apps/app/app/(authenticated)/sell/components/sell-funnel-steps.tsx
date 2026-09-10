import { cn } from "@repo/design-system/lib/utils";
import { CheckIcon } from "lucide-react";

const steps = [
  { id: 1, label: "Идентификация" },
  { id: 2, label: "Снимки" },
  { id: 3, label: "Данни и AI" },
  { id: 4, label: "Цена и преглед" },
] as const;

interface SellFunnelStepsProps {
  readonly currentStep: 1 | 2 | 3 | 4;
}

export const SellFunnelSteps = ({ currentStep }: SellFunnelStepsProps) => (
  <nav aria-label="Стъпки за създаване на обява">
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((step) => {
        const complete = step.id < currentStep;
        const current = step.id === currentStep;

        return (
          <li
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm",
              current && "border-foreground bg-foreground text-background",
              complete && "bg-secondary"
            )}
            key={step.id}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border font-semibold text-xs",
                current && "border-background/40",
                complete && "border-foreground bg-foreground text-background"
              )}
            >
              {complete ? (
                <CheckIcon aria-hidden="true" className="size-3.5" />
              ) : (
                step.id
              )}
            </span>
            <span className="truncate">{step.label}</span>
          </li>
        );
      })}
    </ol>
  </nav>
);
