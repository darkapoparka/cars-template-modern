import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { cn } from "@repo/design-system/lib/utils";
import {
  getMobileQuickPillClassName,
  marketplaceDiscoveryFrameClassName,
  mobileDealerContentClassName,
} from "@repo/marketplace-ui";
import { MobilePillRail } from "@repo/marketplace-ui/components/mobile-pill-rail";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowRight, Globe2, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicExternalInventory } from "@/lib/public-external-inventory";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { MobileDealerServiceHero } from "../components/mobile-dealer-service-hero";
import { MobileServiceHelp } from "../components/mobile-service-help";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";
import { ExternalImportListings } from "./components/external-import-listings";
import { ImportRequestForm } from "./components/import-request-form";
import { MobileImportSourceSearch } from "./components/mobile-import-source-search";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const path = "/imports";
const supportedOrigins = new Set(["ALL", "CN", "DE", "US", "JP", "KR"]);
const connectedExternalOrigins = ["US"] as const;
const importRoutes = [
  {
    code: "ALL",
    labelBg: "Всички",
    labelEn: "All",
  },
  {
    code: "CN",
    flagPath: "/images/flags/cn.svg",
    labelBg: "Китай",
    labelEn: "China",
  },
  {
    code: "DE",
    flagPath: "/images/flags/de.svg",
    labelBg: "Германия",
    labelEn: "Germany",
  },
  {
    code: "US",
    flagPath: "/images/flags/us.svg",
    labelBg: "САЩ",
    labelEn: "United States",
  },
  {
    code: "JP",
    flagPath: "/images/flags/jp.svg",
    labelBg: "Япония",
    labelEn: "Japan",
  },
  {
    code: "KR",
    flagPath: "/images/flags/kr.svg",
    labelBg: "Южна Корея",
    labelEn: "South Korea",
  },
] as const;

const importFaqs = {
  bg: [
    {
      answer:
        "Можете да изпратите линк към конкретна обява или само марка, модел и основни изисквания. Не е необходимо да имате готова оферта.",
      question: "Как да започна?",
    },
    {
      answer:
        "Изпратете ни линка, ако имате такъв, и добавете държава, година, пробег и бюджет, когато са известни. Останалото ще уточним по телефона.",
      question: "Каква информация е полезна?",
    },
    {
      answer:
        "Доставката до България е фиксираната дестинация на заявката. Крайната цена и срокът се потвърждават за конкретния автомобил, маршрут и документи.",
      question: "Какво означава доставка до България?",
    },
    {
      answer:
        "Не е нужен акаунт. Оставете телефон и екипът на Day & Night ще се свърже с вас, за да уточни следващата стъпка.",
      question: "Трябва ли да се регистрирам?",
    },
  ],
  en: [
    {
      answer:
        "Send a link to a specific listing or just the make, model, and main requirements. You do not need a completed offer.",
      question: "How do I start?",
    },
    {
      answer:
        "Send the link if you have one, and add the origin, year, mileage, and budget when known. We will clarify the rest by phone.",
      question: "What information helps?",
    },
    {
      answer:
        "Bulgaria is the fixed destination for this request. Final price and timing are confirmed for the specific vehicle, route, and documents.",
      question: "What does delivery to Bulgaria mean?",
    },
    {
      answer:
        "No account is required. Leave a phone number and the Day & Night team will contact you about the next step.",
      question: "Do I need to register?",
    },
  ],
} as const;

const pageCopy = {
  bg: {
    deliveryDestination: "България",
    deliveryPrefix: "Внос и доставка до ",
    desktopDescription:
      "Разгледайте актуални оферти от свързани източници или поставете линк към автомобил, който вече сте намерили.",
    desktopTitle: "Реални обяви за внос",
    faqDescription: "Най-важното за заявката и доставката до България.",
    faqTitle: "Често задавани въпроси",
    heroAlt: "Автомобил за международен внос",
    mobileTitle: "Внос на автомобил",
    routesLabel: "Бързи маршрути за внос",
    routesTitle: "Маршрути за внос",
    sourceLabel: "Линк към обявата",
    sourcePlaceholder: "Поставете линк към обявата",
    sourcePlaceholderLong: "Поставете линк към конкретна обява",
    submitLabel: "Изпратете линка",
    submitText: "Поискай оферта",
  },
  en: {
    deliveryDestination: "Bulgaria",
    deliveryPrefix: "Import and delivery to ",
    desktopDescription:
      "Browse current offers from connected sources or paste a vehicle listing you have already found.",
    desktopTitle: "Real vehicles available for import",
    faqDescription: "The essentials about requests and delivery to Bulgaria.",
    faqTitle: "Frequently asked questions",
    heroAlt: "Vehicle prepared for international import",
    mobileTitle: "Import a vehicle",
    routesLabel: "Quick import routes",
    routesTitle: "Import routes",
    sourceLabel: "Vehicle listing link",
    sourcePlaceholder: "Paste listing link",
    sourcePlaceholderLong: "Paste a specific listing link",
    submitLabel: "Submit the link",
    submitText: "Request a quote",
  },
} as const;

const getRouteLabel = (
  route: (typeof importRoutes)[number],
  locale: "bg" | "en"
) => (locale === "bg" ? route.labelBg : route.labelEn);

const getQueryValue = (
  query: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = query[key];
  const firstValue = Array.isArray(value) ? value[0] : value;
  return typeof firstValue === "string" ? firstValue.trim() : "";
};

const getDefaultOrigin = (value: string) => {
  const normalizedValue = value.toUpperCase();
  return supportedOrigins.has(normalizedValue) ? normalizedValue : "ALL";
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isBg = normalizeSeoLocale(locale) === "bg";

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? "Изпратете линк или данни за автомобил от чужбина. Day & Night ще уточни заявката за внос и доставка до България."
      : "Send a listing link or vehicle details from abroad. Day & Night will discuss the import request and delivery to Bulgaria.",
    locale,
    path,
    title: isBg
      ? "Внос на автомобил по заявка | Day & Night"
      : "Vehicle import request | Day & Night",
  });
};

export default async function ImportsPage({ params, searchParams }: PageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const normalizedLocale = normalizeSeoLocale(locale);
  const text = pageCopy[normalizedLocale];
  const localize = (href: string) => getLocalizedPath(normalizedLocale, href);
  const defaultOrigin = getDefaultOrigin(getQueryValue(query, "origin"));
  const defaultSourceUrl = getQueryValue(query, "sourceUrl").slice(0, 500);
  const showImportRequest =
    Boolean(defaultSourceUrl) || getQueryValue(query, "start") === "1";
  const externalInventory = await Promise.all(
    (defaultOrigin === "ALL" ? connectedExternalOrigins : [defaultOrigin]).map(
      (origin) => getPublicExternalInventory(origin)
    )
  );
  const formOrigin = defaultOrigin === "ALL" ? "" : defaultOrigin;
  const renderImportRouteLinks = () =>
    importRoutes.map((route) => (
      <Link
        aria-current={defaultOrigin === route.code ? "page" : undefined}
        className={getMobileQuickPillClassName(defaultOrigin === route.code)}
        href={`${localize(path)}?origin=${route.code}`}
        key={route.code}
      >
        {"flagPath" in route ? (
          <Image
            alt=""
            className="h-3.5 w-[21px] rounded-[3px] object-cover"
            height={14}
            src={route.flagPath}
            width={21}
          />
        ) : (
          <Globe2 aria-hidden="true" className="size-4" />
        )}
        {getRouteLabel(route, normalizedLocale)}
      </Link>
    ));
  return (
    <PublicMarketplaceFrame
      activeMode="imports"
      dealerActive
      locale={normalizedLocale}
      mastheadVariant="discovery"
      showMobileDealerHeader={false}
      showMobileFooter={false}
    >
      <main
        className="pb-10 lg:min-h-[38rem] lg:pb-14"
        data-slot="imports-page"
      >
        <MobileDealerServiceHero
          helpAction={
            <MobileServiceHelp
              faqs={importFaqs[normalizedLocale]}
              locale={normalizedLocale}
              title={
                normalizedLocale === "bg"
                  ? "Как работи вносът"
                  : "How importing works"
              }
            />
          }
          imageClassName="object-center"
          imageSrc="/images/services/import-shipping-yellow-v1.png"
          locale={normalizedLocale}
          tone="import"
        >
          <div className="h-full">
            <h1 className="sr-only">{text.mobileTitle}</h1>
            <MobileImportSourceSearch
              actionHref={`${localize(path)}#import-request`}
              defaultOrigin={formOrigin}
              defaultSourceUrl={defaultSourceUrl}
              label={text.sourceLabel}
              locale={normalizedLocale}
              placeholder={text.sourcePlaceholder}
              submitLabel={text.submitLabel}
            />
          </div>
        </MobileDealerServiceHero>
        <div
          className={`${mobileDealerContentClassName} pb-3 lg:hidden`}
          data-slot="mobile-dealer-content"
        >
          <section
            aria-labelledby="import-routes-heading"
            className="scroll-mt-24"
            data-slot="mobile-import-routes"
            id="import-countries"
          >
            <h2 className="sr-only" id="import-routes-heading">
              {text.routesTitle}
            </h2>
            <nav aria-label={text.routesLabel}>
              <MobilePillRail data-slot="import-country-rail">
                <div className="flex min-w-max gap-2">
                  {renderImportRouteLinks()}
                </div>
              </MobilePillRail>
            </nav>
          </section>
        </div>

        <div className={cn(marketplaceDiscoveryFrameClassName, "py-0 lg:py-9")}>
          <section className="hidden border-border border-b pb-6 lg:block">
            <h1 className="font-semibold text-page-title tracking-tight">
              {text.desktopTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-body text-muted-foreground">
              {text.desktopDescription}
            </p>
            <search className="mt-5 block max-w-3xl">
              <form
                action={`${localize(path)}#import-request`}
                className="flex h-12 items-center gap-2 rounded-xl bg-secondary p-1 pl-4 outline-none focus-within:ring-[3px] focus-within:ring-[var(--lead-site-accent-ring)]"
                method="get"
              >
                {formOrigin ? (
                  <input name="origin" type="hidden" value={formOrigin} />
                ) : null}
                <Search
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <label className="flex h-full min-w-0 flex-1 items-center">
                  <span className="sr-only">{text.sourceLabel}</span>
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    defaultValue={defaultSourceUrl}
                    inputMode="url"
                    maxLength={500}
                    name="sourceUrl"
                    placeholder={text.sourcePlaceholderLong}
                    required
                    type="url"
                  />
                </label>
                <button
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[var(--lead-site-accent)] px-4 font-semibold text-sm text-white outline-none transition-colors hover:bg-[var(--lead-site-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent)] focus-visible:ring-offset-2"
                  type="submit"
                >
                  {text.submitText}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </form>
            </search>
          </section>

          <section
            aria-labelledby="desktop-import-routes-heading"
            className="hidden scroll-mt-24 lg:mt-5 lg:block"
            data-slot="desktop-import-routes"
          >
            <h2 className="sr-only" id="desktop-import-routes-heading">
              {text.routesTitle}
            </h2>
            <nav
              aria-label={text.routesLabel}
              className="no-scrollbar overflow-x-auto"
            >
              <div className="flex min-w-max gap-2">
                {renderImportRouteLinks()}
              </div>
            </nav>
          </section>

          {showImportRequest ? (
            <section
              className="relative isolate mt-5 lg:mt-0 lg:min-h-[38rem] lg:overflow-hidden lg:rounded-xl lg:border lg:border-border lg:shadow-panel"
              data-slot="imports-hero"
              id="import-request"
            >
              <Image
                alt={text.heroAlt}
                className="hidden object-cover object-[72%_center] lg:block"
                fill
                priority
                sizes="(min-width: 1792px) calc(100vw - 96px), (min-width: 1440px) 1360px, calc(100vw - 48px)"
                src="/lead-import-hero-v1.png"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 hidden bg-black/10 lg:block"
              />

              <div
                className="relative z-10 flex items-center justify-center lg:min-h-[38rem] lg:p-8"
                data-slot="imports-hero-content"
              >
                <div className="w-full max-w-6xl scroll-mt-24">
                  <ImportRequestForm
                    defaultOrigin={formOrigin}
                    defaultSourceUrl={defaultSourceUrl}
                    locale={normalizedLocale}
                    privacyHref={localize("/legal/privacy")}
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section
            aria-labelledby="external-import-listings-heading"
            className="-mx-3 bg-background px-4 pb-3 sm:-mx-4 sm:px-4 lg:mt-6 lg:bg-zinc-50 lg:px-4 lg:py-4"
            data-slot="external-import-listings"
          >
            <ExternalImportListings
              data={externalInventory}
              headingId="external-import-listings-heading"
              importsPath={localize(path)}
              locale={normalizedLocale}
              selectedOrigin={defaultOrigin}
              showRequestAction={!showImportRequest}
            />
          </section>

          <section
            aria-labelledby="imports-faq-heading"
            className="mx-auto mt-8 hidden w-full max-w-4xl sm:mt-10 lg:block"
            data-slot="imports-faq"
          >
            <h2
              className="text-center font-semibold text-section-title tracking-tight sm:text-section-title-lg"
              id="imports-faq-heading"
            >
              {text.faqTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-body text-muted-foreground">
              {text.faqDescription}
            </p>
            <Accordion
              className="mt-4 overflow-hidden rounded-xl border border-border bg-card px-5 shadow-panel sm:px-6"
              collapsible
              type="single"
            >
              {importFaqs[normalizedLocale].map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index + 1}`}>
                  <AccordionTrigger className="py-5 text-left text-body hover:no-underline">
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
