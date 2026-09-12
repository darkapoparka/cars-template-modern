import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { mobileResponsiveFormFocusClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
import type { MobileFormDraft } from "../../components/mobile-form-draft";
import { MobileVehicleTaxonomyFields } from "../../components/mobile-vehicle-taxonomy-fields";
import { PublicContactFields } from "../../components/public-contact-fields";
import { ImportOriginField } from "./import-origin-field";
import {
  importRequestCopy,
  importRequestInputClassName,
} from "./import-request-policy";

export const ImportVehicleFields = ({
  defaultOrigin,
  sourceUrl,
  draft = {},
  locale,
}: {
  defaultOrigin: string;
  sourceUrl: string;
  draft?: MobileFormDraft;
  locale: "bg" | "en";
}) => {
  const text = importRequestCopy[locale];

  return (
    <fieldset
      aria-label={text.headingVehicle}
      className="grid gap-4 lg:rounded-xl lg:border lg:border-border/80 lg:p-4"
      data-slot="import-vehicle-details"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(9rem,1fr)_minmax(16rem,2.15fr)_minmax(9rem,1fr)_minmax(10rem,1.25fr)]">
        <ImportOriginField
          defaultOrigin={defaultOrigin}
          key={defaultOrigin || "no-origin"}
          label={text.origin}
          locale={locale}
          placeholder={text.originPlaceholder}
        />

        <MobileVehicleTaxonomyFields
          initialMake={draft.make}
          initialModel={draft.model}
          locale={locale}
          makeLabel={sourceUrl.trim() ? text.make : text.requiredMake}
          makePlaceholder={text.makePlaceholder}
          modelLabel={sourceUrl.trim() ? text.model : text.requiredModel}
          modelPlaceholder={text.modelPlaceholder}
          required={!sourceUrl.trim()}
          variant="import"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label className="text-xs" htmlFor="import-year">
            {text.year}
          </Label>
          <Input
            className={importRequestInputClassName}
            defaultValue={draft.year}
            id="import-year"
            inputMode="numeric"
            max={2100}
            min={1886}
            name="year"
            placeholder="2022"
            type="number"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs" htmlFor="import-mileage">
            {text.mileage}
          </Label>
          <Input
            className={importRequestInputClassName}
            defaultValue={draft.mileage}
            id="import-mileage"
            inputMode="numeric"
            max={10_000_000}
            min={0}
            name="mileage"
            placeholder={text.mileagePlaceholder}
            type="number"
          />
        </div>

        <div className="col-span-2 grid gap-1.5 sm:col-span-1">
          <Label className="text-xs" htmlFor="import-budget">
            {text.budget}
          </Label>
          <Input
            className={importRequestInputClassName}
            defaultValue={draft.budget}
            id="import-budget"
            maxLength={80}
            name="budget"
            placeholder={text.budgetPlaceholder}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs" htmlFor="import-message">
          {text.message}
        </Label>
        <Textarea
          className={`h-24 min-h-24 resize-none rounded-xl border-transparent bg-zinc-100 text-base shadow-none placeholder:text-zinc-600 lg:h-20 lg:min-h-20 lg:rounded-lg lg:bg-secondary ${mobileResponsiveFormFocusClassName}`}
          defaultValue={draft.message}
          id="import-message"
          maxLength={3000}
          name="message"
          placeholder={text.messagePlaceholder}
        />
      </div>
    </fieldset>
  );
};

export const ImportContactFields = ({
  draft = {},
  locale,
}: {
  draft?: MobileFormDraft;
  locale: "bg" | "en";
}) => {
  const text = importRequestCopy[locale];

  return (
    <fieldset
      aria-label={text.headingContact}
      className="grid gap-4 pt-4 lg:rounded-xl lg:border lg:border-border lg:p-4"
      data-slot="import-contact-details"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <PublicContactFields
          copy={text}
          draft={draft}
          idPrefix="import"
          inputClassName={importRequestInputClassName}
          labelClassName="text-xs"
        />
      </div>
    </fieldset>
  );
};
