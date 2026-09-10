"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
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
import { type MobileFormDraft, readMobileFormDraft } from "./mobile-form-draft";
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
  onRestoreFocus,
  contactHref,
  locale,
  onOpenChange,
  onVinChange,
  open,
  vin,
}: {
  focusVin?: boolean;
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
  const [draft, setDraft] = useState<MobileFormDraft>({});
  const vinRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
          setDraft(readMobileFormDraft(formRef.current));
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
        method="get"
        ref={formRef}
      >
        <input name="intent" type="hidden" value="sell" />
        <p className="mb-4 text-[14px] text-zinc-600 leading-5">
          {content.formDescription}
        </p>

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
              placeholder="WBA..."
              ref={vinRef}
              spellCheck={false}
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
            modelPlaceholder="X5"
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
              max={2100}
              min={1886}
              name="year"
              placeholder="2022"
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
              max={10_000_000}
              min={0}
              name="mileage"
              placeholder="62 000"
              required={!hasCompleteVin}
              type="number"
            />
          </div>
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
              className="font-semibold text-foreground underline-offset-4 hover:underline"
              href={leadSite.phoneHref}
            >
              {leadSite.phoneDisplay}
            </Link>
          </p>
        </div>
      </form>
    </MobileMarketplaceOverlayShell>
  );
};
