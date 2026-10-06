"use client";

import { cn } from "@repo/design-system/lib/utils";
import { withoutBasePath } from "@repo/internationalization/paths";
import {
  isPublicSitePathEnabled,
  type PublicSiteConfig,
  publicSite,
} from "@repo/marketplace/site-config";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-header.module.css";
import { DealerDesktopLogo } from "./dealer-desktop-logo";
import { DealerNavigationLink } from "./dealer-navigation-link";
import { DesktopSavedCars } from "./desktop-saved-cars";
import type { MarketplaceMode } from "./marketplace-masthead";

const inventoryRoutePattern =
  /^\/(?:bg|en)\/(?:cars|trucks|vans|motorbikes|listing)(?:\/|$)/;

export { DesktopSavedCars } from "./desktop-saved-cars";

/** Desktop-only dealership navigation, shared by inventory and service routes. */
export const DealerDesktopHeader = ({
  activeMode = "buy",
  children,
  homeHref,
  locale,
  layout = "showroom",
  site = publicSite,
}: {
  activeMode?: MarketplaceMode | "home" | null;
  children?: ReactNode;
  homeHref?: string;
  locale?: string;
  site?: PublicSiteConfig;
  layout?: "default" | "showroom";
}) => {
  const pathname = withoutBasePath(usePathname());
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const destinations = [
    { id: "home", path: "/", label: isBg ? "Начало" : "Home" },
    { id: "buy", path: "/cars", label: isBg ? "Автомобили" : "Cars" },
    { id: "services", path: "/services", label: isBg ? "Услуги" : "Services" },
    { id: "about", path: "/about", label: isBg ? "За нас" : "About us" },
    { id: "contact", path: "/contact", label: isBg ? "Контакти" : "Contact" },
  ];

  return (
    <>
      <header
        className={cn(styles.header, "dealer-desktop-header hidden lg:block")}
        data-has-search={Boolean(children)}
        data-layout={layout}
        data-slot="dealer-desktop-header"
      >
        <div className={cn(styles.nav, "dealer-desktop-nav")}>
          <Link
            aria-label={`${site.identity.desktopPreview?.name ?? site.identity.name} ${isBg ? "начало" : "home"}`}
            className={cn(styles.brand, "dealer-desktop-brand relative")}
            href={homeHref ?? getLocalizedPublicPath(locale, "/")}
          >
            <DealerDesktopLogo className={styles.logo} site={site} />
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
                <DealerNavigationLink
                  aria-current={
                    pathname ===
                      getLocalizedPublicPath(locale, destination.path) ||
                    (destination.id === "buy" &&
                      activeMode === "buy" &&
                      inventoryRoutePattern.test(pathname))
                      ? "page"
                      : undefined
                  }
                  data-marketplace-mode={destination.id}
                  data-slot="marketplace-mode-action"
                  href={getLocalizedPublicPath(locale, destination.path)}
                  key={destination.id}
                >
                  {destination.label}
                </DealerNavigationLink>
              ))}
          </nav>
          <div className={cn(styles.contact, "dealer-desktop-contact")}>
            <DesktopSavedCars className={styles.action} locale={locale} />
            <Link
              className={cn(styles.action, styles.primaryAction)}
              href={getLocalizedPublicPath(locale, "/contact")}
            >
              {isBg ? "Свържете се" : "Contact us"}
            </Link>
          </div>
        </div>
      </header>
      {children}
    </>
  );
};
