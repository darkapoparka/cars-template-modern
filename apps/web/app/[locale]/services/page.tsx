import { leadSite } from "@repo/marketplace";
import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import Image from "@repo/marketplace-ui/components/public-image";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";
import { pageCopy } from "../contact/copy";
import { ServiceCatalogue } from "./service-catalogue";
import styles from "./services.module.css";

interface ServicesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ServicesPageProps) {
  const { locale } = await params;
  const bg = normalizeSeoLocale(locale) === "bg";
  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    locale,
    path: "/services",
    title: `${bg ? "Услуги" : "Services"} | ${leadSite.shortName}`,
    description: bg
      ? "Разгледайте възможностите за покупка, продажба, внос и финансиране."
      : "Explore buying, selling, importing and financing your next car.",
  });
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  requirePublicSitePath("/services");
  const { locale } = await params;
  const normalized = normalizeSeoLocale(locale);
  const bg = normalized === "bg";
  const title = bg ? "Нашите услуги" : "Our services";
  const artwork =
    publicSite.artwork.desktopServiceCards ??
    publicSite.artwork.desktopServices;
  const images = new Map([
    ["/cars", artwork?.browse],
    ["/sell", artwork?.sell],
    ["/imports", artwork?.imports],
    ["/lease", artwork?.finance],
  ]);
  const services = pageCopy[normalized].services.filter((service) =>
    isPublicSitePathEnabled(service.href, publicSite)
  );
  const labels: Record<string, string> = bg
    ? {
        "/cars": "Наличности",
        "/imports": "Внос",
        "/lease": "Лизинг",
        "/sell": "Продажба",
      }
    : {
        "/cars": "In stock",
        "/imports": "Import",
        "/lease": "Leasing",
        "/sell": "Selling",
      };
  const mobileTitles: Record<string, string> = bg
    ? {
        "/cars": "Наличности",
        "/imports": "Внос",
        "/lease": "Лизинг",
        "/sell": "Продай",
      }
    : {
        "/cars": "In stock",
        "/imports": "Import",
        "/lease": "Leasing",
        "/sell": "Sell",
      };
  return (
    <PublicMarketplaceFrame
      locale={normalized}
      showMobileDealerHeader={false}
      showMobileFooter={false}
    >
      <ServiceCatalogue
        artwork={
          publicSite.artwork.desktopHeroScene ?? publicSite.artwork.heroScene
        }
        locale={normalized}
        services={services.map((service) => {
          const image = images.get(service.href);
          const Icon = service.icon;
          return {
            href: service.href,
            title: service.title,
            description: service.description,
            label: labels[service.href] ?? service.title,
            card: (
              <Link
                className={styles.card}
                data-slot="dealer-service-card"
                href={getLocalizedPath(normalized, service.href)}
                key={service.href}
              >
                <div className={styles.artwork}>
                  {image ? (
                    <Image
                      alt=""
                      fill
                      sizes="(min-width: 1440px) 312px, (min-width: 1200px) 25vw, (min-width: 1024px) 50vw, (min-width: 544px) 228px, calc((100vw - 68px) / 2)"
                      src={image}
                    />
                  ) : (
                    <Icon aria-hidden size={64} />
                  )}
                </div>
                <div className={styles.copy}>
                  <h2>
                    <span className={styles.desktopTitle}>{service.title}</span>
                    <span className={styles.mobileTitle}>
                      {mobileTitles[service.href] ?? service.title}
                    </span>
                  </h2>
                  <p>{service.description}</p>
                  <span className={styles.action}>
                    <span className={styles.actionLabel}>
                      {bg ? "Разгледайте" : "Explore"}
                    </span>
                    <ArrowUpRight aria-hidden size={18} />
                  </span>
                </div>
              </Link>
            ),
          };
        })}
        title={title}
      />
    </PublicMarketplaceFrame>
  );
}
