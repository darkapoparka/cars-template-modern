import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { cn } from "@repo/design-system/lib/utils";
import {
  getListingPath,
  leadSite,
  parseMarketplaceSearchParams,
  vehicleCategories,
  vehicleMakes,
} from "@repo/marketplace";
import { marketplaceDiscoveryFrameClassName } from "@repo/marketplace-ui";
import { VehicleCard } from "@repo/marketplace-ui/components/vehicle-card";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicMarketplaceListings } from "@/lib/public-marketplace-data";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { MobileSellVehicleExperience } from "../components/mobile-sell-vehicle-experience";
import { MobileVehicleTaxonomyFields } from "../components/mobile-vehicle-taxonomy-fields";
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
        answer:
          "Финалната оценка се прави след оглед на място в шоурума ни в Студентски град, София.",
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
        answer:
          "The final appraisal follows an in-person inspection at our showroom in Studentski grad, Sofia.",
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

const categoryLabels = {
  bg: {
    car: "Автомобил",
    motorbike: "Мотоциклет",
    truck: "Камион",
    van: "Бус",
  },
  en: {
    car: "Car",
    motorbike: "Motorbike",
    truck: "Truck",
    van: "Van",
  },
} as const;

const sellableCategories = vehicleCategories.filter(
  (category) => category.id !== "lease"
);

const sellCategoryAssets = {
  car: "/lead-sell-car-v1.png",
  motorbike: "/lead-sell-motorcycle-v1.png",
  truck: "/lead-sell-truck-v1.png",
  van: "/lead-sell-van-v1.png",
} as const;

const inputClassName =
  "h-11 rounded-lg border-transparent bg-secondary shadow-none";
const selectClassName =
  "h-11 w-full rounded-lg border border-transparent bg-secondary px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const getQueryValue = (
  query: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = query[key];
  const firstValue = Array.isArray(value) ? value[0] : value;
  return typeof firstValue === "string" ? firstValue.trim() : "";
};

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
  const [{ locale }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const normalizedLocale = normalizeSeoLocale(locale);
  const copy = pageCopy[normalizedLocale];
  const localize = (path: string) => getLocalizedPath(normalizedLocale, path);
  const { listings } = await getPublicMarketplaceListings(
    parseMarketplaceSearchParams({ category: "car" })
  );

  const requestedCategory = getQueryValue(query, "category");
  const requestedMake = getQueryValue(query, "make");
  const requestedModel = getQueryValue(query, "model");
  const initialCategory = sellableCategories.some(
    (category) => category.id === requestedCategory
  )
    ? requestedCategory
    : "car";
  const initialMake = vehicleMakes.includes(requestedMake) ? requestedMake : "";
  const initialModel = requestedModel.slice(0, 80);
  const initialMileage = getQueryValue(query, "mileage");
  const initialNotes = getQueryValue(query, "notes").slice(0, 500);
  const initialYear = getQueryValue(query, "year");
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
          inventory={
            listings.length ? (
              listings
                .slice(0, 6)
                .map((listing) => (
                  <VehicleCard
                    density="compact"
                    href={localize(getListingPath(listing))}
                    key={listing.id}
                    listing={listing}
                    locale={normalizedLocale}
                    presentation="discovery"
                  />
                ))
            ) : (
              <p className="py-6 text-center text-sm text-zinc-600">
                {normalizedLocale === "bg"
                  ? "В момента няма налични автомобили."
                  : "No cars are currently available."}
              </p>
            )
          }
          locale={normalizedLocale}
        />
        <div
          className={cn(
            marketplaceDiscoveryFrameClassName,
            "hidden py-5 sm:py-7 lg:block lg:py-9"
          )}
        >
          <section
            className="relative isolate min-h-[34rem] overflow-hidden rounded-xl border border-border shadow-panel lg:min-h-[32rem]"
            data-slot="sell-hero"
          >
            <Image
              alt={
                normalizedLocale === "bg"
                  ? "Автомобили пред модерен шоурум"
                  : "Vehicles outside a modern showroom"
              }
              className="object-cover object-center"
              fill
              priority
              sizes="(min-width: 1792px) calc(100vw - 96px), (min-width: 1440px) 1360px, calc(100vw - 48px)"
              src="/images/sell/day-night-sell-centered-hero-v2.webp"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-black/15" />

            <div
              className="relative z-10 flex min-h-[40rem] items-start justify-center px-3 pt-6 pb-3 lg:min-h-[32rem] lg:items-center lg:p-8"
              data-slot="sell-hero-content"
            >
              <div
                className="w-full max-w-6xl rounded-xl bg-card p-4 shadow-2xl shadow-black/20 sm:p-6 lg:border lg:border-border/80 lg:p-7"
                data-slot="sell-form-panel"
              >
                <h1 className="text-balance text-center font-semibold text-[1.875rem] leading-[1.08] tracking-[-0.03em] lg:text-page-title-lg">
                  {copy.title}
                </h1>
                <p className="mx-auto mt-3 max-w-[17rem] text-center text-muted-foreground text-sm leading-6 lg:max-w-2xl lg:text-body">
                  <span className="lg:hidden">
                    {normalizedLocale === "bg"
                      ? "Започнете с основните данни. Ще се свържем с вас за оглед и оферта."
                      : "Start with the essentials. We will contact you to arrange an inspection and offer."}
                  </span>
                  <span className="hidden lg:inline">{copy.description}</span>
                </p>

                <form
                  action={localize("/contact")}
                  aria-label={copy.formLabel}
                  className={cn(
                    "mt-5 grid grid-cols-2 gap-3",
                    hasSelectedVehicle
                      ? "lg:grid-cols-[minmax(9rem,1fr)_minmax(15rem,1.7fr)_minmax(8rem,1fr)_minmax(9rem,1fr)_auto]"
                      : "lg:grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(11rem,1.25fr)_minmax(8rem,1fr)_minmax(9rem,1fr)_auto]"
                  )}
                  data-slot="sell-vehicle-start-form"
                  method="get"
                >
                  <input name="intent" type="hidden" value="sell" />
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
                      max={2100}
                      min={1886}
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
                      max={10_000_000}
                      min={0}
                      name="mileage"
                      placeholder={copy.mileagePlaceholder}
                      required
                      type="number"
                    />
                  </div>

                  <div className="col-span-2 flex items-end justify-end lg:col-span-1">
                    <Button
                      className="h-11 w-full gap-2 rounded-lg bg-[var(--lead-site-accent)] px-5 text-white shadow-none hover:bg-[var(--lead-site-accent-hover)]"
                      type="submit"
                    >
                      {copy.primaryAction}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Button>
                  </div>

                  <div
                    className="col-span-2 hidden rounded-lg border border-border/60 bg-secondary/80 p-2.5 lg:col-span-full lg:block"
                    data-slot="sell-optional-details"
                  >
                    <div className="flex items-center justify-between gap-3 px-1">
                      <Label className="text-meta" htmlFor="sell-notes">
                        {copy.detailsLabel}
                      </Label>
                      <span className="text-muted-foreground text-xs">
                        {copy.detailsHint}
                      </span>
                    </div>
                    <Textarea
                      className="mt-2 h-20 min-h-20 resize-none rounded-md border-transparent bg-card shadow-none"
                      defaultValue={initialNotes}
                      id="sell-notes"
                      maxLength={500}
                      name="notes"
                      placeholder={copy.detailsPlaceholder}
                    />
                  </div>
                </form>

                <div className="mt-5 flex flex-col items-start justify-center gap-2 border-border border-t pt-4 text-sm sm:flex-row sm:items-center sm:gap-7 lg:mt-5">
                  <p className="text-muted-foreground">
                    {normalizedLocale === "bg"
                      ? "Търсите автомобил за бартер?"
                      : "Looking for a trade-in vehicle?"}{" "}
                    <Link
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                      href={localize("/cars")}
                    >
                      {normalizedLocale === "bg"
                        ? "Вижте наличностите"
                        : "Browse inventory"}
                    </Link>
                  </p>
                  <p className="text-muted-foreground">
                    {copy.contactPrompt}{" "}
                    <a
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                      href={leadSite.phoneHref}
                    >
                      {leadSite.phoneDisplay}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

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
