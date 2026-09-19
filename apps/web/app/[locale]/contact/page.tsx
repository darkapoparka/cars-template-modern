import { leadSite } from "@repo/marketplace";
import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { isPublicContactSubmissionAvailable } from "@/lib/public-contact-readiness";
import {
  createPublicLocalizedMetadata,
  getPublicSearchRobots,
} from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { parseSellVehicleDraft } from "@/lib/sell-vehicle-draft";
import { MobileAboutContact } from "../components/mobile-about-contact";
import {
  buildFinancingContactMessage,
  parseFinancingRequestHref,
} from "../components/mobile-financing-policy";
import { PublicEnquiryForm } from "../components/public-enquiry-form";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";
import { pageCopy } from "./copy";
import { SellContactHandoff } from "./sell-contact-handoff";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

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
  searchParams,
}: ContactPageProps): Promise<Metadata> => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const isBg = normalizeSeoLocale(locale) === "bg";

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? `${leadSite.name} в София — автомобили в наличност, внос по заявка и собствен лизинг.`
      : `${leadSite.name} in ${leadSite.city} — vehicles in stock, import on request, and in-house leasing.`,
    locale,
    path: "/contact",
    robots: getPublicSearchRobots(query),
    title: isBg
      ? `За нас и контакти | ${leadSite.shortName}`
      : `About and contact | ${leadSite.shortName}`,
  });
};

export default async function ContactPage({
  params,
  searchParams,
}: ContactPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const normalizedLocale = normalizeSeoLocale(locale);
  const copy = pageCopy[normalizedLocale];
  const services = copy.services.filter((service) =>
    isPublicSitePathEnabled(service.href, publicSite)
  );
  const submissionAvailable = isPublicContactSubmissionAvailable();
  const financeQuery = new URLSearchParams();
  for (const key of ["intent", "vehicle", "term", "deposit"]) {
    const value = getQueryValue(query, key);
    if (value) {
      financeQuery.set(key, value);
    }
  }
  const financeContext = parseFinancingRequestHref(`/contact?${financeQuery}`);
  if (financeContext) {
    requirePublicSitePath("/lease");
  }
  const initialMessage = financeContext
    ? buildFinancingContactMessage({
        deposit: financeContext.deposit ?? "flexible",
        locale: normalizedLocale,
        note: "",
        request: financeContext,
      })
    : "";
  const localize = (path: string) => getLocalizedPath(normalizedLocale, path);
  const sellContext =
    getQueryValue(query, "intent") === "sell"
      ? parseSellVehicleDraft(query)
      : null;

  if (sellContext) {
    requirePublicSitePath("/sell");
    return (
      <SellContactHandoff
        draft={sellContext}
        locale={normalizedLocale}
        submissionAvailable={submissionAvailable}
      />
    );
  }

  return (
    <PublicMarketplaceFrame
      locale={normalizedLocale}
      showMobileDealerHeader={false}
    >
      <main className="bg-background text-zinc-950 lg:bg-inverse lg:text-inverse-foreground">
        <MobileAboutContact locale={normalizedLocale} services={services} />
        <section className="relative isolate hidden overflow-hidden border-white/10 border-b lg:block">
          <div className="absolute inset-0 -z-20 bg-inverse">
            <Image
              alt={copy.heroImageAlt}
              className="object-cover object-center opacity-95"
              fill
              priority
              sizes="100vw"
              src={publicSite.artwork.contactHero}
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-black/55"
          />

          <div className="mx-auto grid min-h-[31rem] max-w-[90rem] items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.65fr)] lg:gap-12 lg:px-8 lg:py-22">
            <div className="max-w-2xl">
              <h1 className="max-w-2xl text-balance font-semibold text-display tracking-[-0.03em] lg:text-display-lg">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-xl text-prose text-white/80 sm:text-lg sm:leading-7">
                {copy.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 lg:mt-8">
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 font-semibold text-sm text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-3"
                  href={localize("/cars")}
                  style={{ backgroundColor: leadSite.accent }}
                >
                  {copy.inventoryAction}
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white/10 px-5 font-semibold text-sm text-white ring-1 ring-white/25 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-3"
                  href={leadSite.phoneHref}
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {copy.phoneAction}
                </a>
              </div>
            </div>

            <aside className="border-white/25 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
              <h2 className="font-semibold text-dialog-title tracking-tight">
                {copy.contactTitle}
              </h2>
              <p className="mt-2 max-w-xs text-body text-white/75">
                {copy.contactDescription}
              </p>
              <div className="mt-6 max-w-xs">
                <a
                  className="group flex min-h-14 w-full items-center justify-between border-white/20 border-b py-3 transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-3"
                  href={leadSite.phoneHref}
                >
                  <span>
                    <span className="block text-meta text-white/65">
                      Телефон
                    </span>
                    <span className="mt-1 block font-semibold text-base">
                      {leadSite.phoneDisplay}
                    </span>
                  </span>
                  <Phone
                    aria-hidden="true"
                    className="size-4 text-white/65 transition-colors group-hover:text-white"
                  />
                </a>
                <a
                  aria-label={`${copy.mapAction}: ${leadSite.address}, ${leadSite.city}`}
                  className="group flex min-h-14 w-full items-center justify-between border-white/20 border-b py-3 transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-3"
                  href={leadSite.mapsUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>
                    <span className="block text-meta text-white/65">
                      {copy.locationLabel}
                    </span>
                    <span className="mt-1 block font-semibold text-body">
                      {leadSite.address}, {leadSite.city}
                    </span>
                  </span>
                  <MapPin
                    aria-hidden="true"
                    className="size-4 text-white/65 transition-colors group-hover:text-white"
                  />
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="hidden border-white/10 border-b lg:block">
          <div className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="text-balance font-semibold text-section-title tracking-[-0.02em] sm:text-section-title-lg">
                {copy.servicesTitle}
              </h2>
              <p className="mt-3 max-w-xl text-body text-white/75">
                {copy.servicesDescription}
              </p>
            </div>

            <div className="mt-9 grid border-white/15 border-y md:grid-cols-4">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Link
                    className={`group flex min-h-40 items-start gap-4 py-5 transition-colors hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[-3px] md:px-5 md:py-6 ${
                      index > 0
                        ? "border-white/15 border-t md:border-t-0 md:border-l"
                        : ""
                    }`}
                    href={localize(service.href)}
                    key={service.title}
                  >
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-white/60 transition-colors group-hover:text-white"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-base">
                          {service.title}
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-white/45 transition-colors group-hover:text-white"
                        />
                      </span>
                      <span className="mt-2 block max-w-xs text-meta text-white/70">
                        {service.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
        {submissionAvailable && (
          <div className="mx-auto max-w-2xl px-4 py-8" id="contact-form">
            <PublicEnquiryForm
              initialMessage={initialMessage}
              intent={financeContext ? "finance" : "general"}
              locale={normalizedLocale}
            />
          </div>
        )}
      </main>
    </PublicMarketplaceFrame>
  );
}
