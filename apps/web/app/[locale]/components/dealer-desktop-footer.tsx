import { leadSite } from "@repo/marketplace";
import { getLeadCopy } from "@repo/marketplace/lead-copy";
import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import { MarketplaceLocaleSwitchLink } from "@repo/marketplace-ui";
import { DealerDesktopLogo } from "@repo/marketplace-ui/components/dealer-desktop-logo";
import { DesktopSavedCars } from "@repo/marketplace-ui/components/desktop-saved-cars";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import styles from "./dealer-desktop-footer.module.css";

/** The curated Boxcar footer uses the existing dealer identity, capabilities and locale switch. */
export function DealerDesktopFooter({ locale }: { locale: string }) {
  const normalized = normalizeSeoLocale(locale);
  const bg = normalized === "bg";
  const text = (bulgarian: string, english: string) =>
    bg ? bulgarian : english;
  const path = (href: string) => getLocalizedPath(normalized, href);
  const identity = publicSite.identity.desktopPreview ?? publicSite.identity;
  const tagline = publicSite.identity.desktopPreview
    ? publicSite.identity.desktopPreview.tagline[normalized]
    : getLeadCopy(locale).tagline;
  const groups = [
    {
      title: text("Открийте автомобил", "Find a car"),
      links: [
        ["/cars", text("Всички автомобили", "Browse all cars")],
        ["/cars?sort=newest", text("Най-нови автомобили", "Latest arrivals")],
        ["/cars?sort=price_asc", text("По цена", "Browse by price")],
        ["/lease", text("Финансиране", "Vehicle financing")],
      ],
    },
    {
      title: text("Разгледайте", "Explore"),
      links: [
        ["/about", text("За нас", "About us")],
        ["/services", text("Услуги", "Services")],
        ["/blog", text("Съвети за покупка", "Buying advice")],
        ["/guides", text("Ръководства", "Buyer guides")],
        ["/imports", text("Внос на автомобил", "Import a car")],
        ["/sell", text("Продайте автомобила си", "Sell your car")],
      ],
    },
  ];
  return (
    <footer className={styles.footer} data-slot="public-marketplace-footer">
      <div className={styles.frame}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link
              aria-label={`${identity.name} ${text("начало", "home")}`}
              href={path("/")}
            >
              <DealerDesktopLogo className={styles.logo} inverse />
            </Link>
            <p>{tagline}</p>
          </div>
          {groups.map((group, index) => (
            <nav aria-label={group.title} key={group.title}>
              <h2>{group.title}</h2>
              {group.links
                .filter(([href]) => isPublicSitePathEnabled(href, publicSite))
                .map(([href, label]) => (
                  <Link href={path(href)} key={href}>
                    {label}
                  </Link>
                ))}
              {index === 0 && <DesktopSavedCars locale={locale} />}
            </nav>
          ))}
          <div className={styles.contact}>
            <h2>{text("Посетете автосалона", "Visit the showroom")}</h2>
            <p>
              {getLeadCopy(locale).address}, {getLeadCopy(locale).city}
            </p>
            <Link
              className={styles.cta}
              data-slot="button"
              href={path("/contact")}
            >
              {text("Свържете се", "Get in touch")}
              <ArrowUpRight aria-hidden size={20} />
            </Link>
            <Link href={path("/contact?intent=viewing")}>
              {text("Уговорете оглед", "Arrange a viewing")}
            </Link>
            <a href={leadSite.phoneHref}>{leadSite.phoneDisplay}</a>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} {identity.name}.{" "}
            {text("Всички права запазени.", "All rights reserved.")}
          </span>
          <div>
            <Link href={path("/legal/privacy")}>
              {text("Поверителност", "Privacy")}
            </Link>
            <Link href={path("/legal/terms")}>{text("Условия", "Terms")}</Link>
            <MarketplaceLocaleSwitchLink
              label={text("Държава и език", "Country and language")}
              locale={locale}
            >
              {text("English", "Български")}
            </MarketplaceLocaleSwitchLink>
          </div>
        </div>
        {leadSite.staticDemoMode && (
          <p className={styles.note}>
            {text(
              "Демо шаблон · примерни автомобили и данни за контакт. Запитванията са само локален преглед.",
              "Template preview · sample vehicles and contact details. Enquiries are local previews."
            )}
          </p>
        )}
      </div>
    </footer>
  );
}
