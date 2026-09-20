import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { cn } from "@repo/design-system/lib/utils";
import {
  formatFuelType,
  formatMileage,
  formatMoney,
  formatTransmission,
  getListingPath,
  leadSite,
  parseMarketplaceSearchParams,
} from "@repo/marketplace";
import { localizeListingCopy } from "@repo/marketplace/listing-copy";
import { marketplaceDiscoveryFrameClassName } from "@repo/marketplace-ui";
import { getVehicleCardSpecFacts } from "@repo/marketplace-ui/lib/vehicle-card-policy";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { getPublicMarketplaceListings } from "@/lib/public-marketplace-data";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import desktopStyles from "../components/public-desktop-layout.module.css";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";
import { LeaseVehicleSelector } from "./lease-vehicle-selector";

interface LeasePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ vehicle?: string | string[] }>;
}

const leadingYearPattern = /^\d{4}\s+/;

const pageCopy = {
  bg: {
    badge: `Финансиране от ${leadSite.shortName}`,
    description:
      "Изберете автомобил от наличностите и се свържете с нас за индивидуална оферта. Параметрите се уточняват според автомобила и вашия профил.",
    faqTitle: "Често задавани въпроси",
    faqs: [
      {
        answer:
          "Изберете автомобил от наличностите и изпратете заявка с предпочитания срок и първоначална вноска. Екипът ще се свърже с вас, за да уточни възможността за финансиране и конкретните условия.",
        question: "Как да започна?",
      },
      {
        answer:
          "Първоначалната вноска и срокът се определят индивидуално спрямо избрания автомобил и условията по офертата.",
        question: "Каква първоначална вноска е необходима?",
      },
      {
        answer: `Необходимите документи зависят от конкретния случай. Екипът на ${leadSite.shortName} ще ви даде точен списък още при първия разговор.`,
        question: "Какви документи ще са ми нужни?",
      },
      {
        answer:
          "Възможността за финансиране се потвърждава за конкретния автомобил. Свържете се с нас, за да проверим избраната от вас кола.",
        question: "Всеки автомобил ли може да бъде финансиран?",
      },
    ],
    title: "Финансиране за следващия ви автомобил",
  },
  en: {
    badge: `Financing from ${leadSite.shortName}`,
    description:
      "Choose a vehicle from our inventory and contact us for a tailored offer. The terms are confirmed for the vehicle and your individual profile.",
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        answer:
          "Choose a vehicle from the inventory and send a request with your preferred term and initial payment. The team will contact you to confirm financing availability and the specific terms.",
        question: "How do I get started?",
      },
      {
        answer:
          "The initial payment and term are determined individually according to the selected vehicle and the offer conditions.",
        question: "What initial payment is required?",
      },
      {
        answer: `Required documents depend on the individual case. The ${leadSite.shortName} team will give you an exact list during the first conversation.`,
        question: "Which documents will I need?",
      },
      {
        answer:
          "Financing availability is confirmed for each vehicle. Contact us to check the car you have selected.",
        question: "Can every vehicle be financed?",
      },
    ],
    title: "Financing for your next vehicle",
  },
} as const;

export const generateMetadata = async ({
  params,
}: LeasePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isBg = normalizeSeoLocale(locale) === "bg";

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? `Индивидуална оферта за финансиране на автомобил от ${leadSite.name}.`
      : `A tailored vehicle financing offer from ${leadSite.name}.`,
    locale,
    path: "/lease",
    title: isBg ? "Финансиране на автомобил" : "Vehicle financing",
  });
};

export default async function LeasePage({
  params,
  searchParams,
}: LeasePageProps) {
  requirePublicSitePath("/lease");
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const initialVehicleId =
    typeof query.vehicle === "string" ? query.vehicle : "";
  const normalizedLocale = normalizeSeoLocale(locale);
  const copy = pageCopy[normalizedLocale];
  const localize = (path: string) => getLocalizedPath(normalizedLocale, path);
  const { listings } = await getPublicMarketplaceListings(
    parseMarketplaceSearchParams({ category: "car" })
  );
  const vehicles = listings.map((listing) => ({
    filterData: {
      category: listing.category,
      spec: listing.spec,
      seller: listing.seller,
      location: listing.location,
      supply: listing.supply,
      delivery: listing.delivery,
    },
    detailHref: localize(getListingPath(listing)),
    fuelLabel: formatFuelType(listing.spec.fuelType, normalizedLocale),
    id: listing.id,
    imageAlt:
      localizeListingCopy(listing, normalizedLocale).images[0]?.alt ||
      listing.title,
    imageUrl: listing.images[0]?.url || "/lead-hero.jpg",
    mileageLabel: formatMileage(listing.spec.mileageValue, normalizedLocale),
    ...(listing.monthlyEstimate
      ? {
          monthlyLabel: `${formatMoney(
            listing.monthlyEstimate,
            normalizedLocale
          )}/${normalizedLocale === "bg" ? "мес." : "mo."}`,
        }
      : {}),
    priceLabel: formatMoney(listing.price, normalizedLocale),
    priceAmount: listing.price.amount,
    fuelType: listing.spec.fuelType,
    year: listing.spec.year,
    title: listing.title.replace(leadingYearPattern, ""),
    transmissionLabel:
      getVehicleCardSpecFacts(listing, normalizedLocale).find(
        (fact) => fact.id === "transmission"
      )?.value ??
      formatTransmission(listing.spec.transmission, normalizedLocale),
    yearLabel: String(listing.spec.year),
  }));

  return (
    <PublicMarketplaceFrame
      activeMode="lease"
      desktopIntro={{ title: copy.title, description: copy.description }}
      locale={normalizedLocale}
      mobileDealerHeaderTone="clean"
      showMobileDealerHeader={vehicles.length === 0}
      showMobileFooter={false}
    >
      <main className="lg:min-h-[38rem]">
        <div
          className={cn(
            marketplaceDiscoveryFrameClassName,
            "py-0 max-lg:px-0",
            desktopStyles.content
          )}
          data-slot="lease-content-frame"
        >
          <section className="relative isolate" data-slot="lease-hero">
            <div
              className="relative flex items-center justify-center"
              data-slot="lease-hero-content"
            >
              <div
                className={cn(
                  "w-full max-w-5xl overflow-hidden bg-card p-0",
                  desktopStyles.panel
                )}
                data-slot="lease-finance-card"
              >
                {vehicles.length === 0 && (
                  <h1 className="sr-only lg:hidden">{copy.title}</h1>
                )}
                <LeaseVehicleSelector
                  contactHref={localize("/contact")}
                  faqs={copy.faqs}
                  initialVehicleId={initialVehicleId}
                  key={initialVehicleId}
                  locale={normalizedLocale}
                  phoneDisplay={leadSite.phoneDisplay}
                  phoneHref={leadSite.phoneHref}
                  vehicles={vehicles}
                />
              </div>
            </div>
          </section>

          <section
            className="mx-auto mt-8 hidden w-full max-w-4xl sm:mt-10 lg:block"
            data-slot="lease-faq"
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
