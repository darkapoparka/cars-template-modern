"use client";

import { Separator } from "@repo/design-system/components/ui/separator";
import {
  formatMileage,
  formatMoney,
  type PriceCurrency,
} from "@repo/marketplace";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ListingFormSummaryState {
  readonly locationComplete: boolean;
  readonly mileage: string;
  readonly photosComplete: boolean;
  readonly price: string;
  readonly priceComplete: boolean;
  readonly title: string;
  readonly vehicleComplete: boolean;
}

interface ListingFormSummaryProps {
  initialState: ListingFormSummaryState;
}

const getStringValue = (formData: FormData, name: string) => {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
};

const getNamedControl = (form: HTMLFormElement, name: string) => {
  const control = form.elements.namedItem(name);

  return control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLTextAreaElement
    ? control
    : null;
};

const isValidFilledControl = (form: HTMLFormElement, name: string) => {
  const control = getNamedControl(form, name);
  const value = control?.value.trim() ?? "";

  if (!(control && value && control.validity.valid)) {
    return false;
  }

  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLTextAreaElement
  ) {
    if (control.minLength >= 0 && value.length < control.minLength) {
      return false;
    }

    if (control.maxLength >= 0 && value.length > control.maxLength) {
      return false;
    }
  }

  return true;
};

const getPriceCurrency = (value: string): PriceCurrency =>
  value === "EUR" ? "EUR" : "BGN";

const parseNumericValue = (value: string) => {
  if (!value) {
    return null;
  }

  const amount = Number(value);

  return Number.isFinite(amount) ? amount : null;
};

const readSummaryState = (
  form: HTMLFormElement,
  photosComplete: boolean
): ListingFormSummaryState => {
  const formData = new FormData(form);
  const title = getStringValue(formData, "title");
  const price = getStringValue(formData, "price");
  const currency = getStringValue(formData, "currency");
  const mileage = getStringValue(formData, "mileage");
  const locationCountry = getStringValue(formData, "locationCountry");
  const mileageValue = parseNumericValue(mileage);
  const priceValue = parseNumericValue(price);

  return {
    locationComplete:
      isValidFilledControl(form, "locationCity") && locationCountry.length >= 2,
    mileage:
      mileageValue === null
        ? "Не е зададен"
        : formatMileage(mileageValue, "bg"),
    photosComplete,
    price:
      priceValue === null
        ? "Не е зададена"
        : formatMoney(
            { amount: priceValue, currency: getPriceCurrency(currency) },
            "bg"
          ),
    priceComplete: ["price", "currency", "priceType"].every((name) =>
      isValidFilledControl(form, name)
    ),
    title: title || "Нова обява",
    vehicleComplete: [
      "category",
      "make",
      "model",
      "year",
      "mileage",
      "title",
      "bodyType",
      "fuelType",
      "transmission",
      "description",
    ].every((name) => isValidFilledControl(form, name)),
  };
};

export const ListingFormSummary = ({
  initialState,
}: ListingFormSummaryProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState(initialState);

  useEffect(() => {
    const form = rootRef.current?.closest("form");

    if (!form) {
      return;
    }

    const updateSummary = () => {
      setSummary(readSummaryState(form, initialState.photosComplete));
    };

    updateSummary();
    form.addEventListener("change", updateSummary);
    form.addEventListener("input", updateSummary);

    return () => {
      form.removeEventListener("change", updateSummary);
      form.removeEventListener("input", updateSummary);
    };
  }, [initialState.photosComplete]);

  const reviewItems = [
    {
      complete: summary.vehicleComplete,
      label: "Данни за автомобила",
    },
    { complete: summary.priceComplete, label: "Цена" },
    { complete: summary.photosComplete, label: "Снимки" },
    {
      complete: summary.locationComplete,
      label: "Местоположение",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-3 sm:gap-4" ref={rootRef}>
      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <h2 className="font-semibold text-base">Преглед на обявата</h2>
        <Separator className="my-4" />
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Заглавие</p>
            <p aria-live="polite" className="font-medium">
              {summary.title}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Цена</p>
            <p aria-live="polite" className="font-medium">
              {summary.price}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Пробег</p>
            <p aria-live="polite" className="font-medium">
              {summary.mileage}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <h2 className="font-semibold text-base">Готовност за преглед</h2>
        <div className="mt-3 space-y-2 text-sm">
          {reviewItems.map((item) => {
            const StatusIcon = item.complete ? CheckCircle2Icon : CircleIcon;

            return (
              <div
                className="flex items-center justify-between gap-2"
                key={item.label}
              >
                <span className="flex items-center gap-2">
                  <StatusIcon
                    aria-hidden="true"
                    className="h-4 w-4 text-muted-foreground"
                  />
                  {item.label}
                </span>
                <span
                  aria-live="polite"
                  className="text-muted-foreground text-xs"
                >
                  {item.complete ? "Готово" : "Необходимо"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
