import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { cn } from "@repo/design-system/lib/utils";
import { withBasePath } from "@repo/internationalization/paths";
import { leadSite, vehicleCategories } from "@repo/marketplace";
import { DealerDesktopHero } from "@repo/marketplace-ui/components/dealer-desktop-hero";
import {
  DesktopActionButton,
  DesktopActionPanel,
} from "@repo/marketplace-ui/components/desktop-action-panel";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import {
  parseSellVehicleDraft,
  sellCategoryLabels,
  serializeSellVehicleDraft,
  vehicleMileageMaximum,
  vehicleYearMaximum,
  vehicleYearMinimum,
} from "@/lib/sell-vehicle-draft";
import { MobileSellVehicleExperience } from "../components/mobile-sell-vehicle-experience";
import { MobileVehicleTaxonomyFields } from "../components/mobile-vehicle-taxonomy-fields";
import desktopStyles from "../components/public-desktop-layout.module.css";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";

interface SellPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const pageCopy = {
  bg: {
    categoryLabel: "Категория",
    contactPrompt: "Предпочитате директен разговор?",
    detailsHint: "по желание",
    detailsLabel: "Екстри и бележки",
    detailsPlaceholder:
      "Състояние, сервизна история, екстри или нещо важно за автомобила.",
    description:
      "Дайте ни основните данни за автомобила. Екипът ни ще се свърже с вас за оглед и конкретна оферта.",
    faqTitle: "Как протича оценката",
    faqs: [
      {
        answer:
          "Не. Можете да предложите автомобила за директно изкупуване, без да купувате друг.",
        question: "Задължителен ли е бартерът?",
      },
      {
        answer:
          "Марка, модел, година и пробег са достатъчни за първоначалния разговор. Подгответе и телефон за връзка.",
        question: "Какви данни са необходими?",
      },
      {
        answer: `Финалната оценка се прави след оглед на място в шоурума ни в ${leadSite.district.bg}, София.`,
        question: "Може ли оценка само по снимки?",
      },
      {
        answer:
          "Регистрационните документи, сервизната история и информацията за ремонти помагат за по-бърза оценка.",
        question: "Какво да подготвя за огледа?",
      },
    ],
    formDescription:
      "Без регистрация. Започнете с основните данни, а ние ще уточним следващата стъпка.",
    formLabel: "Заявете оценка на автомобил",
    makeLabel: "Марка",
    mileageLabel: "Пробег",
    mileagePlaceholder: "62 000 км",
    modelLabel: "Модел",
    modelPlaceholder: "напр. Octavia",
    primaryAction: "Продължи",
    changeVehicle: "Променете автомобила",
    selectedVehicleLabel: "Избран автомобил",
    title: "Продайте ни автомобила си",
    yearLabel: "Година",
    yearPlaceholder: "2022",
  },
  en: {
    categoryLabel: "Category",
    contactPrompt: "Prefer a direct conversation?",
    detailsHint: "optional",
    detailsLabel: "Extras and notes",
    detailsPlaceholder:
      "Condition, service history, extras, or anything important about the vehicle.",
    description:
      "Give us the essentials about your vehicle. Our team will contact you to arrange an inspection and a concrete offer.",
    faqTitle: "How the appraisal works",
    faqs: [
      {
        answer:
          "No. You can offer the vehicle for direct purchase without buying another car.",
        question: "Is a trade-in required?",
      },
      {
        answer:
          "Make, model, year, and mileage are enough for the initial conversation. Please also leave a phone number.",
        question: "What information do you need?",
      },
      {
        answer: `The final appraisal follows an in-person inspection at our showroom in ${leadSite.district.en}, Sofia.`,
        question: "Can you appraise it from photos only?",
      },
      {
        answer:
          "Registration documents, service history, and repair information help us appraise the car faster.",
        question: "What should I prepare?",
      },
    ],
    formDescription:
      "No account required. Start with the essentials and we will agree the next step with you.",
    formLabel: "Request a vehicle appraisal",
    makeLabel: "Make",
    mileageLabel: "Mileage",
    mileagePlaceholder: "62,000 km",
    modelLabel: "Model",
    modelPlaceholder: "e.g. Octavia",
    primaryAction: "Continue",
    changeVehicle: "Change vehicle",
    selectedVehicleLabel: "Selected vehicle",
    title: "Sell us your vehicle",
    yearLabel: "Year",
    yearPlaceholder: "2022",
  },
} as const;

const categoryLabels = sellCategoryLabels;
const sellCategoryAssets = leadSite.sellCategoryAssets;
const sellableCategories = vehicleCategories.filter(
  (category) => category.id !== "lease"
);

const inputClassName =
  "h-11 rounded-lg border-transparent bg-secondary shadow-none";
const selectClassName =
  "h-11 w-full rounded-lg border border-transparent bg-secondary px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const generateMetadata = async ({
  params,
}: SellPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isBg = normalizeSeoLocale(locale) === "bg";

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? `Предложете автомобила си за изкупуване или бартер на ${leadSite.name}.`
      : `Offer your vehicle to ${leadSite.name} for purchase or trade-in.`,
    locale,
    path: "/sell",
    title: isBg ? "Продайте ни автомобил" : "Sell us your vehicle",
  });
};

export default async function SellPage({
  params,
  searchParams,
}: SellPageProps) {
  requirePublicSitePath("/sell");
  const [{ locale }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const normalizedLocale = normalizeSeoLocale(locale);
  const copy = pageCopy[normalizedLocale];
  const localize = (path: string) => getLocalizedPath(normalizedLocale, path);

  const initialDraft = parseSellVehicleDraft(query);
  const {
    category: initialCategory,
    make: initialMake,
    model: initialModel,
    mileage: initialMileage,
    notes: initialNotes,
    year: initialYear,
  } = initialDraft;
  const hasSelectedVehicle = Boolean(initialMake && initialModel);
  const selectedVehicleAsset =
    sellCategoryAssets[initialCategory as keyof typeof sellCategoryAssets] ??
    sellCategoryAssets.car;

  return (
    <PublicMarketplaceFrame
      activeMode="sell"
      locale={normalizedLocale}
      showMobileDealerHeader={false}
      showMobileFooter={false}
    >
      <main className="lg:min-h-[38rem]">
        <MobileSellVehicleExperience
          contactHref={localize("/contact")}
          initialDraft={initialDraft}
          key={serializeSellVehicleDraft(initialDraft)}
          locale={normalizedLocale}
        />
        <DealerDesktopHero title={copy.title} variant="service">
          <div
            className={cn(
              "hidden lg:block",
              desktopStyles.content,
              desktopStyles.heroContent
            )}
          >
            <DesktopActionPanel data-slot="sell-hero">
              <div data-slot="sell-form-panel">
                <div className="mb-4 max-w-3xl">
                  <h2 className="font-semibold text-xl tracking-tight">
                    {copy.formLabel}
                  </h2>
                  <p className="mt-2 text-muted-foreground text-sm leading-6">
                    {copy.formDescription}
                  </p>
                </div>
                <form
                  action={localize("/contact")}
                  aria-label={copy.formLabel}
                  className={cn(
                    "grid grid-cols-2 gap-3",
                    hasSelectedVehicle
                      ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,.75fr)_minmax(0,1fr)_auto]"
                      : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,.75fr)_minmax(0,1fr)_auto]"
                  )}
                  data-slot="sell-vehicle-start-form"
                  method="get"
                >
                  <input name="intent" type="hidden" value="sell" />
                  <input name="vin" type="hidden" value={initialDraft.vin} />
                  <div className="grid gap-1.5">
                    <Label className="text-meta" htmlFor="sell-category">
                      {copy.categoryLabel}
                    </Label>
                    <select
                      className={selectClassName}
                      defaultValue={initialCategory}
                      id="sell-category"
                      name="category"
                      required
                    >
                      {sellableCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {categoryLabels[normalizedLocale][category.id]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <MobileVehicleTaxonomyFields
                    initialMake={initialMake}
                    initialModel={initialModel}
                    locale={normalizedLocale}
                    makeLabel={copy.makeLabel}
                    makePlaceholder={copy.makeLabel}
                    modelLabel={copy.modelLabel}
                    modelPlaceholder={copy.modelPlaceholder}
                    required
                    selectedVehicle={
                      hasSelectedVehicle
                        ? {
                            asset: selectedVehicleAsset,
                            changeHref: localize("/sell"),
                            changeLabel: copy.changeVehicle,
                            selectedLabel: copy.selectedVehicleLabel,
                          }
                        : undefined
                    }
                    variant="sell"
                  />

                  <div className="grid gap-1.5">
                    <Label className="text-meta" htmlFor="sell-year">
                      {copy.yearLabel}
                    </Label>
                    <Input
                      className={inputClassName}
                      defaultValue={initialYear}
                      id="sell-year"
                      inputMode="numeric"
                      max={vehicleYearMaximum}
                      min={vehicleYearMinimum}
                      name="year"
                      placeholder={copy.yearPlaceholder}
                      required
                      type="number"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-meta" htmlFor="sell-mileage">
                      {copy.mileageLabel}
                    </Label>
                    <Input
                      className={inputClassName}
                      defaultValue={initialMileage}
                      id="sell-mileage"
                      inputMode="numeric"
                      max={vehicleMileageMaximum}
                      min={0}
                      name="mileage"
                      placeholder={copy.mileagePlaceholder}
                      required
                      type="number"
                    />
                  </div>

                  <div className="col-span-2 flex items-end justify-end lg:col-span-1">
                    <DesktopActionButton className="w-full" type="submit">
                      {copy.primaryAction}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </DesktopActionButton>
                  </div>

                  <details
                    className="col-span-2 hidden lg:col-span-full lg:block"
                    data-slot="sell-optional-details"
                    open={initialNotes ? true : undefined}
                  >
                    <summary className="cursor-pointer font-medium text-meta">
                      <span>{copy.detailsLabel}</span>
                      <span className="ml-2 text-meta text-muted-foreground">
                        {copy.detailsHint}
                      </span>
                    </summary>
                    <Textarea
                      aria-label={copy.detailsLabel}
                      className="mt-2 h-20 min-h-20 resize-none rounded-md border-transparent bg-card shadow-none"
                      defaultValue={initialNotes}
                      id="sell-notes"
                      maxLength={500}
                      name="notes"
                      placeholder={copy.detailsPlaceholder}
                    />
                  </details>
                </form>
                <p className="mt-5 border-border border-t pt-4 text-center text-meta text-muted-foreground">
                  {copy.contactPrompt}{" "}
                  <a
                    className="font-medium text-foreground underline underline-offset-4"
                    href={withBasePath(leadSite.phoneHref)}
                  >
                    {leadSite.phoneDisplay}
                  </a>
                </p>
              </div>
            </DesktopActionPanel>
          </div>
        </DealerDesktopHero>
        <div className={cn("hidden lg:block", desktopStyles.content)}>
          <section
            className="mx-auto mt-8 w-full max-w-4xl sm:mt-10"
            data-slot="sell-faq"
          >
            <h2 className="text-center font-semibold text-section-title tracking-tight sm:text-section-title-lg">
              {copy.faqTitle}
            </h2>
            <Accordion
              className="mt-4 overflow-hidden rounded-xl border border-border bg-card px-5 shadow-panel sm:px-6"
              collapsible
              type="single"
            >
              {copy.faqs.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index + 1}`}>
                  <AccordionTrigger className="py-5 text-left text-body">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-3xl text-muted-foreground leading-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>
    </PublicMarketplaceFrame>
  );
}
