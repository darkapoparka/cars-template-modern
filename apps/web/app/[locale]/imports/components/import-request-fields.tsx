import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { mobileResponsiveFormFocusClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
import type { MobileFormDraft } from "../../components/mobile-form-draft";
import { MobileVehicleTaxonomyFields } from "../../components/mobile-vehicle-taxonomy-fields";
import { ImportOriginField } from "./import-origin-field";
import {
  importRequestCopy,
  importRequestInputClassName,
} from "./import-request-policy";

export const ImportVehicleFields = ({
  defaultOrigin,
  defaultSourceUrl,
  draft = {},
  locale,
}: {
  defaultOrigin: string;
  defaultSourceUrl: string;
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

        <div className="hidden gap-1.5 lg:grid">
          <Label className="text-xs" htmlFor="import-source-url">
            {text.sourceUrl}
          </Label>
          <Input
            className={importRequestInputClassName}
            defaultValue={defaultSourceUrl}
            id="import-source-url"
            inputMode="url"
            maxLength={500}
            name="sourceUrl"
            placeholder={text.sourceUrlPlaceholder}
            type="url"
          />
        </div>

        <MobileVehicleTaxonomyFields
          initialMake={draft.make}
          initialModel={draft.model}
          locale={locale}
          makeLabel={text.make}
          makePlaceholder={text.makePlaceholder}
          modelLabel={text.model}
          modelPlaceholder={text.modelPlaceholder}
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
        <div className="grid gap-1.5">
          <Label className="text-xs" htmlFor="import-name">
            {text.name}
          </Label>
          <Input
            autoComplete="name"
            className={importRequestInputClassName}
            defaultValue={draft.name}
            id="import-name"
            maxLength={100}
            minLength={2}
            name="name"
            placeholder={text.namePlaceholder}
            required
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs" htmlFor="import-phone">
            {text.phone}
          </Label>
          <Input
            autoComplete="tel"
            className={importRequestInputClassName}
            defaultValue={draft.phone}
            id="import-phone"
            maxLength={40}
            minLength={7}
            name="phone"
            placeholder={text.phonePlaceholder}
            required
            type="tel"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs" htmlFor="import-email">
            {text.email}
          </Label>
          <Input
            autoComplete="email"
            className={importRequestInputClassName}
            defaultValue={draft.email}
            id="import-email"
            maxLength={254}
            name="email"
            placeholder={text.emailPlaceholder}
            type="email"
          />
        </div>
      </div>
    </fieldset>
  );
};
