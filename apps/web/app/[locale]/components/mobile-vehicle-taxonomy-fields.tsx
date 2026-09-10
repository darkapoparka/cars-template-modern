"use client";

import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { vehicleMakes } from "@repo/marketplace";
import { mobileFormPickerTriggerClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { MobileVehicleTaxonomyPicker } from "./mobile-vehicle-taxonomy-picker";
import {
  getRequiredVehicleTaxonomyField,
  type VehicleTaxonomyPickerKind,
  vehicleTaxonomyInputClassName,
  vehicleTaxonomySelectClassName,
} from "./mobile-vehicle-taxonomy-policy";

interface MobileVehicleTaxonomyFieldsProps {
  fieldIdPrefix?: string;
  initialMake?: string;
  initialModel?: string;
  locale: "bg" | "en";
  makeLabel: string;
  makePlaceholder: string;
  modelLabel: string;
  modelPlaceholder: string;
  required?: boolean;
  selectedVehicle?: {
    asset: string;
    changeHref: string;
    changeLabel: string;
    selectedLabel: string;
  };
  variant: "import" | "sell";
}

const MobileTaxonomyTrigger = ({
  disabled = false,
  id,
  label,
  onClick,
  placeholder,
  triggerRef,
  value,
}: {
  disabled?: boolean;
  id: string;
  label: string;
  onClick: () => void;
  placeholder: string;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  value: string;
}) => (
  <div className="grid gap-1.5">
    <Label className="text-meta" htmlFor={id}>
      {label}
    </Label>
    <button
      aria-haspopup="dialog"
      className={mobileFormPickerTriggerClassName}
      disabled={disabled}
      id={id}
      onClick={onClick}
      ref={triggerRef}
      type="button"
    >
      <span
        className={
          value ? "truncate text-foreground" : "truncate text-muted-foreground"
        }
      >
        {value || placeholder}
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
    </button>
  </div>
);

export const MobileVehicleTaxonomyFields = ({
  fieldIdPrefix,
  initialMake = "",
  initialModel = "",
  locale,
  makeLabel,
  makePlaceholder,
  modelLabel,
  modelPlaceholder,
  required = false,
  selectedVehicle,
  variant,
}: MobileVehicleTaxonomyFieldsProps) => {
  const idPrefix = fieldIdPrefix ?? variant;
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [openPicker, setOpenPicker] =
    useState<VehicleTaxonomyPickerKind | null>(null);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const makeTriggerRef = useRef<HTMLButtonElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<"make" | "model">("make");

  const open = (kind: VehicleTaxonomyPickerKind) => {
    activeTriggerRef.current = kind === "model" && !make ? "make" : kind;
    setOpenPicker(kind === "model" && !make ? "make" : kind);
    setQuery("");
  };

  const closePicker = () => {
    setOpenPicker(null);
    setQuery("");
  };

  const selectValue = (value: string) => {
    if (openPicker === "make") {
      setMake(value);
      setModel("");
      setOpenPicker("model");
      setQuery("");
      return;
    }
    setModel(value);
    closePicker();
  };

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!(form && required)) {
      return;
    }

    const handleSubmit = (event: SubmitEvent) => {
      const missingField = getRequiredVehicleTaxonomyField(make, model);
      if (!missingField) {
        return;
      }

      event.preventDefault();
      if (window.matchMedia("(min-width: 1024px)").matches) {
        form.querySelector<HTMLElement>(`[name="${missingField}"]`)?.focus();
        return;
      }
      setOpenPicker(missingField);
      activeTriggerRef.current = missingField;
      setQuery("");
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [make, model, required]);

  let desktopFields: ReactNode;
  if (variant === "sell" && selectedVehicle && make && model) {
    desktopFields = (
      <div className="col-span-2 hidden gap-1.5 lg:col-span-1 lg:grid">
        <span className="text-xs">{selectedVehicle.selectedLabel}</span>
        <Link
          aria-label={selectedVehicle.changeLabel}
          className="group grid h-11 w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden rounded-lg border border-border/60 bg-card p-1.5 text-left outline-none transition-colors hover:bg-control-hover focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:gap-2"
          href={selectedVehicle.changeHref}
        >
          <span className="relative h-8 overflow-hidden rounded-md">
            <Image
              alt=""
              aria-hidden="true"
              className="object-contain"
              fill
              sizes="64px"
              src={selectedVehicle.asset}
            />
          </span>
          <span className="min-w-0 truncate font-semibold text-sm sm:text-base">
            {make} {model}
          </span>
          <span className="flex items-center gap-1 pr-1 font-semibold text-xs">
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      </div>
    );
  } else if (variant === "sell") {
    desktopFields = (
      <>
        <div className="hidden gap-1.5 lg:grid">
          <Label className="text-meta" htmlFor={`${idPrefix}-make`}>
            {makeLabel}
          </Label>
          <select
            aria-required={required}
            className={vehicleTaxonomySelectClassName}
            id={`${idPrefix}-make`}
            name="make"
            onChange={(event) => {
              setMake(event.target.value);
              setModel("");
            }}
            value={make}
          >
            <option disabled value="">
              {makePlaceholder}
            </option>
            {vehicleMakes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 hidden gap-1.5 lg:col-span-1 lg:grid">
          <Label className="text-meta" htmlFor={`${idPrefix}-model`}>
            {modelLabel}
          </Label>
          <Input
            aria-required={required}
            className={vehicleTaxonomyInputClassName}
            disabled={!make}
            id={`${idPrefix}-model`}
            maxLength={80}
            name="model"
            onChange={(event) => setModel(event.target.value)}
            placeholder={modelPlaceholder}
            value={model}
          />
        </div>
      </>
    );
  } else {
    desktopFields = (
      <>
        <div className="hidden gap-1.5 lg:grid">
          <Label className="text-xs" htmlFor={`${idPrefix}-make`}>
            {makeLabel}
          </Label>
          <Input
            className={vehicleTaxonomyInputClassName}
            id={`${idPrefix}-make`}
            maxLength={80}
            name="make"
            onChange={(event) => {
              setMake(event.target.value);
              setModel("");
            }}
            placeholder={makePlaceholder}
            value={make}
          />
        </div>
        <div className="hidden gap-1.5 lg:grid">
          <Label className="text-xs" htmlFor={`${idPrefix}-model`}>
            {modelLabel}
          </Label>
          <Input
            className={vehicleTaxonomyInputClassName}
            id={`${idPrefix}-model`}
            maxLength={120}
            name="model"
            onChange={(event) => setModel(event.target.value)}
            placeholder={modelPlaceholder}
            value={model}
          />
        </div>
      </>
    );
  }

  return (
    <div className="contents" ref={rootRef}>
      <div
        className={
          variant === "sell"
            ? "contents lg:hidden"
            : "col-span-full grid grid-cols-2 gap-3 lg:hidden"
        }
      >
        <MobileTaxonomyTrigger
          id={`${idPrefix}-mobile-make`}
          label={makeLabel}
          onClick={() => open("make")}
          placeholder={makePlaceholder}
          triggerRef={makeTriggerRef}
          value={make}
        />
        <div className={variant === "sell" ? "col-span-2" : undefined}>
          <MobileTaxonomyTrigger
            disabled={!make}
            id={`${idPrefix}-mobile-model`}
            label={modelLabel}
            onClick={() => open("model")}
            placeholder={modelPlaceholder}
            triggerRef={modelTriggerRef}
            value={model}
          />
        </div>
      </div>

      {desktopFields}

      <MobileVehicleTaxonomyPicker
        kind={openPicker}
        locale={locale}
        make={make}
        model={model}
        onBack={() => {
          if (openPicker === "model") {
            setOpenPicker("make");
            setQuery("");
          } else {
            closePicker();
          }
        }}
        onClose={closePicker}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const triggerRef =
            activeTriggerRef.current === "make"
              ? makeTriggerRef
              : modelTriggerRef;
          window.requestAnimationFrame(() =>
            triggerRef.current?.focus({ preventScroll: true })
          );
        }}
        onQueryChange={setQuery}
        onSelect={selectValue}
        query={query}
      />
    </div>
  );
};
