"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Slider } from "@repo/design-system/components/ui/slider";
import { cn } from "@repo/design-system/lib/utils";
import { type CSSProperties, useEffect, useId, useState } from "react";

export type NumericRangeValue = readonly [number, number];

export interface NumericRangePreset {
  label: string;
  value: NumericRangeValue;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const rangesMatch = (left: NumericRangeValue, right: NumericRangeValue) =>
  left[0] === right[0] && left[1] === right[1];

interface NumericRangeFieldProps {
  ariaLabel: string;
  compact: boolean;
  fieldId: string;
  formattedValue: string;
  label: string;
  maximum: number;
  minimum: number;
  onCommit: (value: string) => void;
  onInput: (value: string) => void;
  step: number;
  value: string;
}

const NumericRangeField = ({
  ariaLabel,
  compact,
  fieldId,
  formattedValue,
  label,
  maximum,
  minimum,
  onCommit,
  onInput,
  step,
  value,
}: NumericRangeFieldProps) => (
  <label
    className={cn(
      "group relative font-medium text-meta text-zinc-600",
      compact ? "block" : "space-y-1.5"
    )}
    htmlFor={fieldId}
  >
    <span
      className={cn(
        compact &&
          "pointer-events-none absolute top-2 left-4 z-10 text-xs text-zinc-500 leading-none"
      )}
    >
      {label}
    </span>
    <Input
      aria-label={ariaLabel}
      className={cn(
        "h-12 rounded-xl border-transparent bg-zinc-100 text-base text-transparent tabular-nums shadow-none hover:bg-zinc-200/70 focus-visible:border-[var(--lead-site-accent)] focus-visible:bg-white focus-visible:text-zinc-950 focus-visible:ring-[var(--lead-site-accent-ring)] group-focus-within:text-zinc-950 md:text-base",
        compact && "h-14 pt-5 pb-1"
      )}
      id={fieldId}
      inputMode="numeric"
      max={maximum}
      min={minimum}
      onBlur={(event) => onCommit(event.target.value)}
      onChange={(event) => onInput(event.target.value)}
      step={step}
      type="number"
      value={value}
    />
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-3 bottom-0 left-3 flex h-12 items-center text-base text-zinc-950 tabular-nums group-focus-within:hidden",
        compact && "h-14 items-end pb-1.5"
      )}
    >
      {formattedValue}
    </span>
  </label>
);

export const NumericRangeFilter = ({
  className,
  compact = false,
  formatValue,
  label,
  maximumLabel,
  maximumOnly = false,
  maximumPrefix,
  minimumLabel,
  onValueChange,
  presets = [],
  quickSelectLabel,
  range,
  step,
  thumbLabels,
  value,
}: {
  className?: string;
  compact?: boolean;
  formatValue: (value: number) => string;
  label: string;
  maximumLabel: string;
  maximumOnly?: boolean;
  maximumPrefix: string;
  minimumLabel: string;
  onValueChange: (value: NumericRangeValue) => void;
  presets?: readonly NumericRangePreset[];
  quickSelectLabel: string;
  range: NumericRangeValue;
  step: number;
  thumbLabels: readonly [string, string];
  value: NumericRangeValue;
}) => {
  const inputId = useId();
  const [minimum, maximum] = value;
  const [rangeMinimum, rangeMaximum] = range;
  const [minimumInput, setMinimumInput] = useState(String(minimum));
  const [maximumInput, setMaximumInput] = useState(String(maximum));
  useEffect(() => {
    setMinimumInput(String(minimum));
    setMaximumInput(String(maximum));
  }, [minimum, maximum]);
  const sliderValue = maximumOnly ? [maximum] : [minimum, maximum];
  const summary = maximumOnly
    ? `${maximumPrefix} ${formatValue(maximum)}`
    : `${formatValue(minimum)} – ${formatValue(maximum)}`;

  const updateMinimum = (rawValue: string) => {
    const nextValue = rawValue === "" ? rangeMinimum : Number(rawValue);
    if (!Number.isFinite(nextValue)) {
      return;
    }
    const normalized = Math.min(
      clamp(nextValue, rangeMinimum, rangeMaximum),
      maximum
    );
    setMinimumInput(String(normalized));
    onValueChange([normalized, maximum]);
  };

  const updateMaximum = (rawValue: string) => {
    const nextValue = rawValue === "" ? rangeMaximum : Number(rawValue);
    if (!Number.isFinite(nextValue)) {
      return;
    }
    const normalized = Math.max(
      clamp(nextValue, rangeMinimum, rangeMaximum),
      minimum
    );
    setMaximumInput(String(normalized));
    onValueChange([minimum, normalized]);
  };

  return (
    <div
      className={cn("space-y-5 data-[compact=true]:space-y-4", className)}
      data-compact={compact}
      style={{ "--ring": "var(--lead-site-accent)" } as CSSProperties}
    >
      <div
        className={cn(
          "flex items-baseline gap-4",
          compact || !label ? "justify-center" : "justify-between"
        )}
      >
        {label ? (
          <span
            className={cn(
              "font-semibold text-meta text-zinc-600",
              compact && "sr-only"
            )}
          >
            {label}
          </span>
        ) : null}
        <output
          className={cn(
            "font-semibold text-zinc-950 tabular-nums",
            compact || !label ? "text-center text-xl" : "text-right text-base"
          )}
          data-slot="numeric-range-summary"
        >
          {summary}
        </output>
      </div>

      <Slider
        className={cn("py-1", compact && "py-2")}
        max={rangeMaximum}
        min={rangeMinimum}
        minStepsBetweenThumbs={maximumOnly ? undefined : 1}
        onValueChange={(nextValue) => {
          if (maximumOnly) {
            onValueChange([rangeMinimum, nextValue[0] ?? maximum]);
            return;
          }
          onValueChange([nextValue[0] ?? minimum, nextValue[1] ?? maximum]);
        }}
        step={step}
        thumbLabels={maximumOnly ? [thumbLabels[1]] : thumbLabels}
        value={sliderValue}
      />

      <div
        className={cn(
          "grid gap-3",
          maximumOnly ? "grid-cols-1" : "grid-cols-2"
        )}
      >
        {maximumOnly ? null : (
          <NumericRangeField
            ariaLabel={thumbLabels[0]}
            compact={compact}
            fieldId={`${inputId}-minimum`}
            formattedValue={formatValue(minimum)}
            label={minimumLabel}
            maximum={maximum}
            minimum={rangeMinimum}
            onCommit={updateMinimum}
            onInput={setMinimumInput}
            step={step}
            value={minimumInput}
          />
        )}
        <NumericRangeField
          ariaLabel={thumbLabels[1]}
          compact={compact}
          fieldId={`${inputId}-maximum`}
          formattedValue={formatValue(maximum)}
          label={maximumLabel}
          maximum={rangeMaximum}
          minimum={minimum}
          onCommit={updateMaximum}
          onInput={setMaximumInput}
          step={step}
          value={maximumInput}
        />
      </div>

      {presets.length > 0 ? (
        <div className={cn(!compact && "space-y-2")}>
          <p
            className={cn(
              "font-medium text-meta text-zinc-600",
              compact && "sr-only"
            )}
          >
            {quickSelectLabel}
          </p>
          <div
            className="grid grid-cols-2 gap-2 lg:grid-cols-4"
            data-slot="numeric-range-presets"
          >
            {presets.map((preset) => (
              <Button
                aria-pressed={rangesMatch(value, preset.value)}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border border-transparent bg-zinc-100 px-4 font-semibold text-meta text-zinc-800 shadow-none hover:bg-zinc-200 hover:text-zinc-950 focus-visible:border-transparent focus-visible:ring-[var(--lead-site-accent-ring)] lg:rounded-xl lg:px-3",
                  rangesMatch(value, preset.value) &&
                    "bg-[var(--lead-site-accent)] text-white hover:bg-[var(--lead-site-accent-hover)] hover:text-white"
                )}
                key={`${preset.value[0]}-${preset.value[1]}`}
                onClick={() => onValueChange(preset.value)}
                type="button"
                variant="ghost"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
