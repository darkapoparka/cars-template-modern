"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { leadSite } from "@repo/marketplace";
import {
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayHeader,
  MobileMarketplaceOverlayShell,
  mobileMarketplaceOverlayFieldClassName,
  mobileMarketplaceOverlayInputClassName,
  mobileMarketplaceOverlayPrimaryActionClassName,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  parseSellVehicleDraft,
  readSellVehicleDraft,
  type SellVehicleDraft,
  vehicleMileageMaximum,
  vehicleYearMaximum,
  vehicleYearMinimum,
} from "../../../lib/sell-vehicle-draft";
import { readMobileFormDraft } from "./mobile-form-draft";
import { MobileSellCategoryField } from "./mobile-sell-category-field";
import {
  isCompleteVehicleVin,
  mobileSellInputClassName,
  mobileSellVehicleCopy,
  normalizeVehicleVin,
} from "./mobile-sell-vehicle-policy";
import { MobileVehicleTaxonomyFields } from "./mobile-vehicle-taxonomy-fields";

export const MobileSellVehicleDetailsDrawer = ({
  focusVin = false,
  initialDraft,
  onRestoreFocus,
  contactHref,
  locale,
  onOpenChange,
  onVinChange,
  open,
  vin,
}: {
  focusVin?: boolean;
  initialDraft: SellVehicleDraft;
  onRestoreFocus?: () => void;
  contactHref: string;
  locale: "bg" | "en";
  onOpenChange: (open: boolean) => void;
  onVinChange: (vin: string) => void;
  open: boolean;
  vin: string;
}) => {
  const content = mobileSellVehicleCopy[locale];
  const hasCompleteVin = isCompleteVehicleVin(vin);
  const [draft, setDraft] = useState(initialDraft);
  const [resetKey, setResetKey] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const vinRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);

  return (
    <MobileMarketplaceOverlayShell
      contentDataSlot="mobile-sell-details-drawer"
      onCloseAutoFocus={(event) => {
        if (onRestoreFocus) {
          event.preventDefault();
          onRestoreFocus();
        }
      }}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        if (focusVin) {
          vinRef.current?.focus({ preventScroll: true });
        } else {
          document
            .querySelector<HTMLElement>(
              '[data-slot="mobile-sell-details-drawer"]'
            )
            ?.focus({ preventScroll: true });
        }
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && formRef.current) {
          setDraft(readSellVehicleDraft(readMobileFormDraft(formRef.current)));
          setConfirmReset(false);
        }
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <MobileMarketplaceOverlayHeader
        description={content.formDescription}
        rightAction={
          <MobileMarketplaceOverlayCloseAction ariaLabel={content.close} />
        }
        title={content.formTitle}
      />

      <form
        action={contactHref}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        data-slot="mobile-sell-details-form"
        key={resetKey}
        method="get"
        onInput={() => setConfirmReset(false)}
        ref={formRef}
      >
        <input name="intent" type="hidden" value="sell" />
        <div className="grid gap-1.5">
          <Label className="font-medium text-[13px]" htmlFor="mobile-sell-vin">
            {content.vinOptional}
          </Label>
          <div className={mobileMarketplaceOverlayFieldClassName}>
            <input
              autoCapitalize="characters"
              className={`${mobileMarketplaceOverlayInputClassName} uppercase placeholder:normal-case`}
              id="mobile-sell-vin"
              maxLength={17}
              name="vin"
              onChange={(event) =>
                onVinChange(normalizeVehicleVin(event.target.value))
              }
              pattern="[A-HJ-NPR-Z0-9]{17}"
              placeholder="WBA..."
              ref={vinRef}
              spellCheck={false}
              title={
                locale === "bg"
                  ? "VIN трябва да съдържа 17 знака."
                  : "A VIN must contain 17 characters."
              }
              value={vin}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <MobileSellCategoryField
            initialValue={draft.category}
            label={content.category}
            locale={locale}
          />

          <MobileVehicleTaxonomyFields
            fieldIdPrefix="sell-details"
            initialMake={draft.make}
            initialModel={draft.model}
            locale={locale}
            makeLabel={content.make}
            makePlaceholder={content.make}
            modelLabel={content.model}
            modelPlaceholder={content.modelExample}
            required={!hasCompleteVin}
            variant="sell"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label
              className="font-medium text-[13px]"
              htmlFor="mobile-sell-year"
            >
              {content.year}
            </Label>
            <Input
              className={mobileSellInputClassName}
              defaultValue={draft.year}
              id="mobile-sell-year"
              inputMode="numeric"
              max={vehicleYearMaximum}
              min={vehicleYearMinimum}
              name="year"
              placeholder={content.yearExample}
              required={!hasCompleteVin}
              type="number"
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              className="font-medium text-[13px]"
              htmlFor="mobile-sell-mileage"
            >
              {content.mileage}
            </Label>
            <Input
              className={mobileSellInputClassName}
              defaultValue={draft.mileage}
              id="mobile-sell-mileage"
              inputMode="numeric"
              max={vehicleMileageMaximum}
              min={0}
              name="mileage"
              placeholder={content.mileageExample}
              required={!hasCompleteVin}
              type="number"
            />
          </div>
        </div>

        <div className="mt-3 grid gap-1.5">
          <Label
            className="font-medium text-[13px]"
            htmlFor="mobile-sell-notes"
          >
            {locale === "bg" ? "Бележки (по желание)" : "Notes (optional)"}
          </Label>
          <Textarea
            className="min-h-20 rounded-xl border-transparent bg-zinc-100 text-base shadow-none"
            defaultValue={draft.notes}
            id="mobile-sell-notes"
            maxLength={500}
            name="notes"
          />
        </div>
        <div className="mt-6">
          <Button
            className={`${mobileMarketplaceOverlayPrimaryActionClassName} gap-2 font-semibold text-[14px]`}
            type="submit"
          >
            {content.submit}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <p className="mt-2 text-center text-[13px] text-muted-foreground leading-5">
            {content.directCall}{" "}
            <Link
              className="inline-flex min-h-11 items-center px-2 font-semibold text-foreground underline-offset-4 hover:underline"
              href={leadSite.phoneHref}
            >
              {leadSite.phoneDisplay}
            </Link>
          </p>
          <div className="mt-2 text-center">
            {confirmReset ? (
              <fieldset aria-label={content.clearTitle}>
                <p className="text-[13px] text-zinc-600">
                  {content.clearConfirm}
                </p>
                <button
                  className="min-h-11 rounded-lg px-4 font-semibold text-[14px] text-red-700 focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => {
                    const emptyDraft = parseSellVehicleDraft();
                    setDraft(emptyDraft);
                    onVinChange("");
                    const url = new URL(window.location.href);
                    for (const field of Object.keys(emptyDraft)) {
                      url.searchParams.delete(field);
                    }
                    window.history.replaceState(
                      window.history.state,
                      "",
                      `${url.pathname}${url.search}${url.hash}`
                    );
                    setResetKey((value) => value + 1);
                    setConfirmReset(false);
                    requestAnimationFrame(() => vinRef.current?.focus());
                  }}
                  type="button"
                >
                  {content.clearAction}
                </button>
                <button
                  className="min-h-11 rounded-lg px-4 font-medium text-[14px] focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => {
                    setConfirmReset(false);
                    requestAnimationFrame(() => resetRef.current?.focus());
                  }}
                  type="button"
                >
                  {content.keepAction}
                </button>
              </fieldset>
            ) : (
              <button
                className="min-h-11 rounded-lg px-4 text-[13px] text-zinc-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                onClick={() => setConfirmReset(true)}
                ref={resetRef}
                type="button"
              >
                {content.resetAction}
              </button>
            )}
          </div>
        </div>
      </form>
    </MobileMarketplaceOverlayShell>
  );
};
