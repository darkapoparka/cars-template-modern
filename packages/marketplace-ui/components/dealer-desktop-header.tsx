import { cn } from "@repo/design-system/lib/utils";
import {
  isPublicSitePathEnabled,
  type PublicSiteConfig,
  publicSite,
} from "@repo/marketplace/site-config";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-header.module.css";
import type { MarketplaceMode } from "./marketplace-masthead";

/** Desktop-only dealership navigation, shared by inventory and service routes. */
export const DealerDesktopHeader = ({
  activeMode = "buy",
  children,
  homeHref,
  locale,
  site = publicSite,
}: {
  activeMode?: MarketplaceMode | null;
  children?: ReactNode;
  homeHref?: string;
  locale?: string;
  site?: PublicSiteConfig;
}) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const destinations = [
    { id: "buy", path: "/cars", label: isBg ? "Купи" : "Buy" },
    { id: "sell", path: "/sell", label: isBg ? "Продай" : "Sell" },
    { id: "imports", path: "/imports", label: isBg ? "Внос" : "Import" },
    { id: "lease", path: "/lease", label: isBg ? "Лизинг" : "Financing" },
  ];

  return (
    <>
      <header
        className={cn(styles.header, "dealer-desktop-header hidden lg:block")}
        data-has-search={Boolean(children)}
        data-slot="dealer-desktop-header"
      >
        <div className={cn(styles.nav, "dealer-desktop-nav")}>
          <Link
            aria-label={isBg ? "Начало" : "Home"}
            className={cn(styles.brand, "dealer-desktop-brand relative")}
            href={homeHref ?? getLocalizedPublicPath(locale, "/")}
          >
            <Image
              alt=""
              className="object-contain object-left"
              fill
              priority
              sizes="220px"
              src={site.identity.inverseLogo}
            />
          </Link>
          <nav
            aria-label={
              isBg ? "Основни действия" : "Primary dealership navigation"
            }
            className={cn(styles.segments, "dealer-desktop-segments")}
          >
            {destinations
              .filter((destination) =>
                isPublicSitePathEnabled(destination.path, site)
              )
              .map((destination) => (
                <Link
                  aria-current={
                    activeMode === destination.id ? "page" : undefined
                  }
                  data-marketplace-mode={destination.id}
                  data-slot="marketplace-mode-action"
                  href={getLocalizedPublicPath(locale, destination.path)}
                  key={destination.id}
                >
                  {destination.label}
                </Link>
              ))}
          </nav>
          <div className={cn(styles.contact, "dealer-desktop-contact")}>
            <a
              aria-label={
                isBg
                  ? `Обадете се на ${site.contact.phoneDisplay}`
                  : `Call ${site.contact.phoneDisplay}`
              }
              href={site.contact.phoneHref}
            >
              <Phone aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{site.contact.phoneDisplay}</span>
            </a>
            <a
              aria-label={
                isBg
                  ? `Шоурум: ${site.contact.address}`
                  : `Showroom: ${site.contact.address}`
              }
              className={cn(styles.showroom, "dealer-desktop-showroom")}
              href={site.contact.mapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              <MapPin aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{isBg ? "Шоурум" : "Showroom"}</span>
            </a>
          </div>
        </div>
      </header>
      {children}
    </>
  );
};
