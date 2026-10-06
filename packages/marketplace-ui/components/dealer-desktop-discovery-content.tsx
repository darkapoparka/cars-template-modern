import type { VehicleListing } from "@repo/marketplace";
import { publicSite } from "@repo/marketplace/site-config";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import { DealerDesktopServiceLinks } from "./dealer-desktop-service-links";
import { DealerDesktopStock } from "./dealer-desktop-stock";
import Image from "./public-image";

export interface DealerDesktopJournalCard {
  category: string;
  href: string;
  image: string;
  meta: string;
  title: string;
}

/** Desktop composition reuses the same stock, capabilities and editorial content. */
export const DealerDesktopDiscoveryContent = ({
  articles = [],
  currentPath,
  listings,
  locale,
  totalListings = listings.length,
}: {
  articles?: readonly DealerDesktopJournalCard[];
  currentPath: string;
  listings: readonly VehicleListing[];
  locale?: string;
  totalListings?: number;
}) => {
  const isBg = locale?.startsWith("bg") ?? false;
  const text = (bg: string, en: string) => (isBg ? bg : en);
  const path = (href: string) => getLocalizedPublicPath(locale, href);
  return (
    <div
      className={styles.discoveryContent}
      data-slot="dealer-desktop-discovery-content"
    >
      <DealerDesktopStock
        currentPath={currentPath}
        listings={listings}
        locale={locale}
        totalListings={totalListings}
      />
      <section
        aria-labelledby="desktop-services-heading"
        className={styles.servicesSection}
      >
        <div className={styles.sectionHeading}>
          <h2 id="desktop-services-heading">
            {text(
              "По-лесен път към следващия ви автомобил",
              "A Better Way To Find Your Next Car"
            )}
          </h2>
          <p>
            {text(
              "Покупка, продажба и планиране на следващата стъпка — на едно място.",
              "Buy, sell and plan your next move, all in one place."
            )}
          </p>
        </div>
        <DealerDesktopServiceLinks locale={locale} placement="inventory" />
      </section>
      <section className={styles.visitBanner}>
        <Image
          alt=""
          className={styles.bannerImage}
          fill
          loading="lazy"
          sizes="(min-width: 1400px) 1320px, calc(100vw - 80px)"
          src={
            publicSite.artwork.desktopVisitBanner ??
            publicSite.artwork.contactHero
          }
        />
        <div>
          <h2>
            {text(
              "Следващият ви автомобил. По-лесно.",
              "Your Next Car, Made Simple"
            )}
          </h2>
          <p>
            {text(
              "Харесахте автомобил? Елате да го видите. Задайте въпросите си и открийте дали е подходящ за вас.",
              "Found something you like? Come and see it for yourself. Ask your questions, take a closer look and find your fit."
            )}
          </p>
          <Link
            className={styles.bannerAction}
            href={path("/contact?intent=viewing")}
          >
            {text("Уговорете оглед", "Arrange a viewing")}
            <ArrowUpRight aria-hidden size={18} />
          </Link>
        </div>
      </section>
      {articles.length > 0 && (
        <section
          aria-labelledby="desktop-journal-heading"
          className={styles.journalSection}
        >
          <div className={styles.journalHeading}>
            <h2 id="desktop-journal-heading">
              {text("Съвети за пътя напред", "Advice For The Road Ahead")}
            </h2>
          </div>
          <div className={styles.journalGrid}>
            {articles.slice(0, 3).map((article) => (
              <Link
                className={styles.journalCard}
                href={article.href}
                key={article.href}
              >
                <div className={styles.journalImage}>
                  <Image
                    alt=""
                    fill
                    sizes="(min-width: 1400px) 420px, calc((100vw - 140px) / 3)"
                    src={article.image}
                  />
                </div>
                <div className={styles.journalCardBody}>
                  <p>
                    <span className={styles.journalCategory}>
                      {article.category}
                    </span>
                    <span>{article.meta}</span>
                  </p>
                  <h3>{article.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
