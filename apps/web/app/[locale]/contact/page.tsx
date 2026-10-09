import { withBasePath } from "@repo/internationalization/paths";
import { leadSite } from "@repo/marketplace";
import { getLeadCopy } from "@repo/marketplace/lead-copy";
import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import { DealerDesktopHero } from "@repo/marketplace-ui/components/dealer-desktop-hero";
import { DealerDesktopLogo } from "@repo/marketplace-ui/components/dealer-desktop-logo";
import { DealerSocialLinks } from "@repo/marketplace-ui/components/dealer-social-links";
import { normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { isPublicContactSubmissionAvailable } from "@/lib/public-contact-readiness";
import {
  createPublicLocalizedMetadata,
  getPublicSearchRobots,
} from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { parseSellVehicleDraft } from "@/lib/sell-vehicle-draft";
import desktopStyles from "../components/boxcar-desktop-pages.module.css";
import { DesktopContactPhoneCard } from "../components/desktop-contact-phone-card";
import { DesktopContactPreviewForm } from "../components/desktop-contact-preview-form";
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
      ? `${leadSite.name} в ${getLeadCopy(locale).city} — автомобили в наличност, внос по заявка и собствен лизинг.`
      : `${leadSite.name} in ${getLeadCopy(locale).city} — vehicles in stock, import on request, and in-house leasing.`,
    locale,
    path: "/contact",
    robots: getPublicSearchRobots(query),
    title: isBg
      ? `За нас и контакти | ${leadSite.shortName}`
      : `About and contact | ${leadSite.shortName}`,
  });
};

function DesktopContact({
  initialMessage,
  intent,
  locale,
  submissionAvailable,
  subject,
}: {
  initialMessage: string;
  intent: "finance" | "general";
  locale: "bg" | "en";
  submissionAvailable: boolean;
  subject?: "viewing";
}) {
  const bg = locale === "bg";
  const text = (bulgarian: string, english: string) =>
    bg ? bulgarian : english;
  return (
    <DealerDesktopHero
      actions={[
        {
          href: withBasePath(leadSite.phoneHref),
          label: text("Обадете се", "Call us"),
        },
        {
          href: withBasePath(leadSite.mapsUrl),
          label: text("Как да ни намерите", "Get directions"),
          secondary: true,
          external: true,
        },
      ]}
      appearance="photo"
      artwork={
        publicSite.artwork.desktopPageHeroes?.contact ??
        publicSite.artwork.desktopHeroScene ??
        publicSite.artwork.heroScene
      }
      eyebrow={[getLeadCopy(locale).city, leadSite.district[locale]]
        .filter(Boolean)
        .join(" · ")}
      locale={locale}
      sceneTone="editorial"
      title={text("Свържете се с нас", "Contact us")}
      variant="service"
    >
      <div className={desktopStyles.content}>
        <section
          aria-label={text("Карта на автосалона", "Showroom map")}
          className={desktopStyles.map}
        >
          <iframe
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={leadSite.mapsEmbedUrl}
            title={text("Местоположение на автосалона", "Showroom location")}
          />
          <a
            className={desktopStyles.directions}
            href={withBasePath(leadSite.mapsUrl)}
            rel="noreferrer"
            target="_blank"
          >
            {text("Как да ни намерите", "Get directions")}
            <ArrowUpRight aria-hidden size={20} />
          </a>
        </section>
        <div
          className={desktopStyles.contact}
          data-slot="desktop-contact-panel"
        >
          <section
            aria-labelledby="desktop-contact-form-title"
            className={desktopStyles.contactForm}
            data-slot="desktop-contact-form-panel"
          >
            <DealerDesktopLogo className={desktopStyles.contactLogo} />
            <h2 id="desktop-contact-form-title">
              {text("Нека поговорим", "Get in touch")}
            </h2>
            <p className={desktopStyles.intro}>
              {text(
                "Въпрос за автомобил, оглед или следващата стъпка? Започнете разговора тук.",
                "A question about a car, a viewing or your next step? Start the conversation here."
              )}
            </p>
            {submissionAvailable ? (
              <PublicEnquiryForm
                initialMessage={initialMessage}
                intent={intent}
                locale={locale}
              />
            ) : (
              <DesktopContactPreviewForm
                initialMessage={initialMessage}
                intent={intent}
                locale={locale}
                subject={subject}
              />
            )}
          </section>
          <aside
            aria-labelledby="desktop-contact-details-title"
            className={desktopStyles.details}
            data-slot="desktop-contact-details"
          >
            <h2 id="desktop-contact-details-title">
              {text("Данни за контакт", "Contact details")}
            </h2>
            <p className={desktopStyles.intro}>
              {text(
                "Открийте любимия си автомобил онлайн и го разгледайте на място.",
                "Find your favourite car online, then take a closer look in person."
              )}
            </p>
            <a
              className={`${desktopStyles.contactCard} ${desktopStyles.contactCardLink}`}
              data-slot="desktop-contact-showroom-card"
              href={withBasePath(leadSite.mapsUrl)}
              rel="noreferrer"
              target="_blank"
            >
              <div>
                <h3>{text("Автосалон", "Showroom")}</h3>
                <p>
                  {getLeadCopy(locale).address}, {getLeadCopy(locale).city}
                </p>
              </div>
              <ArrowUpRight
                aria-hidden
                className={desktopStyles.cardArrow}
                size={18}
              />
            </a>
            <DesktopContactPhoneCard
              locale={locale}
              phoneDisplay={leadSite.phoneDisplay}
              phoneHref={withBasePath(leadSite.phoneHref)}
            />
            {leadSite.email && (
              <a
                className={`${desktopStyles.contactCard} ${desktopStyles.contactCardLink}`}
                data-slot="desktop-contact-email-card"
                href={`mailto:${leadSite.email}`}
              >
                <div>
                  <h3>{text("Имейл", "Email")}</h3>
                  <p>{leadSite.email}</p>
                </div>
                <ArrowUpRight
                  aria-hidden
                  className={desktopStyles.cardArrow}
                  size={18}
                />
              </a>
            )}
            <a
              className={`${desktopStyles.contactCard} ${desktopStyles.contactCardLink}`}
              data-slot="desktop-contact-viewing-card"
              href={withBasePath(leadSite.phoneHref)}
            >
              <div>
                <h3>{text("Уговорете оглед", "Arrange a viewing")}</h3>
                <p>
                  {text("Обадете се за удобен час.", "Call to book a viewing.")}
                </p>
              </div>
              <ArrowUpRight
                aria-hidden
                className={desktopStyles.cardArrow}
                size={18}
              />
            </a>
            {Object.values(publicSite.contact.socialLinks).some(Boolean) && (
              <div className={desktopStyles.social}>
                <h3>{text("Последвайте ни", "Follow us")}</h3>
                <p>
                  {text(
                    "Нови автомобили и новини от автосалона.",
                    "New arrivals and showroom updates."
                  )}
                </p>
                <DealerSocialLinks
                  isBg={bg}
                  links={publicSite.contact.socialLinks}
                />
              </div>
            )}
          </aside>
        </div>
      </div>
    </DealerDesktopHero>
  );
}

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
  const sellContext =
    getQueryValue(query, "intent") === "sell" ||
    getQueryValue(query, "topic") === "trade-in"
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
      <main className="bg-background text-zinc-950">
        <MobileAboutContact locale={normalizedLocale} services={services} />
        <DesktopContact
          initialMessage={initialMessage}
          intent={financeContext ? "finance" : "general"}
          locale={normalizedLocale}
          subject={
            getQueryValue(query, "intent") === "viewing" ? "viewing" : undefined
          }
          submissionAvailable={submissionAvailable}
        />
        {submissionAvailable && (
          <div
            className="mx-auto max-w-2xl px-4 py-8 lg:hidden"
            id="contact-form"
          >
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
