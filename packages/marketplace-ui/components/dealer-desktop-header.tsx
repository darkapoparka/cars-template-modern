"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { cn } from "@repo/design-system/lib/utils";
import {
  withBasePath,
  withoutBasePath,
} from "@repo/internationalization/paths";
import { getPreferenceMessages } from "@repo/internationalization/preferences-messages";
import {
  isPublicSitePathEnabled,
  type PublicSiteConfig,
  publicSite,
} from "@repo/marketplace/site-config";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useDesktopMarketplaceViewport } from "../hooks/use-desktop-marketplace-viewport";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-header.module.css";
import { DealerDesktopLogo } from "./dealer-desktop-logo";
import { DealerNavigationLink } from "./dealer-navigation-link";
import { DesktopSavedCars } from "./desktop-saved-cars";
import { LanguageFlag } from "./language-flag";
import { useLocalePreferences } from "./locale-preferences";
import type { MarketplaceMode } from "./marketplace-masthead";

const inventoryRoutePattern =
  /^\/(?:bg|en)\/(?:cars|trucks|vans|motorbikes|listing)(?:\/|$)/;
const editorialRoutePattern = /^\/(?:bg|en)\/(?:blog|guides)(?:\/|$)/;

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
  const isDesktop = useDesktopMarketplaceViewport();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const preferenceRequested = useRef(false);
  const preferences = useLocalePreferences();
  const preferenceLocale = isBg ? "bg" : "en";
  const preferenceLabel =
    getPreferenceMessages(preferenceLocale)["locale.trigger"];
  const preferenceHref =
    getLocalizedPublicPath(locale, "/locale-settings") +
    "?returnTo=" +
    encodeURIComponent(preferences?.returnTo ?? withBasePath(pathname));
  useEffect(() => {
    if (!isDesktop) {
      setMoreOpen(false);
    }
  }, [isDesktop]);
  const destinations = [
    { primary: true, id: "home", path: "/", label: isBg ? "Начало" : "Home" },
    {
      primary: true,
      id: "buy",
      path: "/cars",
      label: isBg ? "Автомобили" : "Cars",
    },
    {
      primary: true,
      id: "services",
      path: "/services",
      label: isBg ? "Услуги" : "Services",
    },
    {
      primary: false,
      id: "blog",
      path: "/guides",
      label: isBg ? "Блог" : "Blog",
    },
    {
      primary: false,
      id: "about",
      path: "/about",
      label: isBg ? "За нас" : "About us",
    },
    {
      primary: false,
      id: "contact",
      path: "/contact",
      label: isBg ? "Контакти" : "Contact",
    },
  ];

  const enabledDestinations = destinations.filter((destination) =>
    isPublicSitePathEnabled(destination.path, site)
  );
  const secondaryDestinations = enabledDestinations.filter(
    (destination) => !destination.primary
  );
  const isDestinationActive = (destination: (typeof destinations)[number]) =>
    pathname === getLocalizedPublicPath(locale, destination.path) ||
    (destination.id === "buy" &&
      activeMode === "buy" &&
      inventoryRoutePattern.test(pathname)) ||
    (destination.id === "blog" && editorialRoutePattern.test(pathname));
  const moreActive = secondaryDestinations.some(isDestinationActive);
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
            {enabledDestinations
              .filter((destination) => destination.primary)
              .map((destination) => (
                <DealerNavigationLink
                  aria-current={
                    isDestinationActive(destination) ? "page" : undefined
                  }
                  data-marketplace-mode={destination.id}
                  data-slot="marketplace-mode-action"
                  href={getLocalizedPublicPath(locale, destination.path)}
                  key={destination.id}
                >
                  {destination.label}
                </DealerNavigationLink>
              ))}
            {secondaryDestinations.length > 0 && (
              <DropdownMenu
                modal={false}
                onOpenChange={setMoreOpen}
                open={isDesktop && moreOpen}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={isBg ? "Още страници" : "More pages"}
                    className={styles.moreTrigger}
                    data-current={moreActive || undefined}
                    disabled={!isDesktop}
                    ref={moreTrigger}
                    type="button"
                  >
                    {isBg ? "Още" : "More"}
                    <ChevronDown aria-hidden="true" size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  aria-label={isBg ? "Още страници" : "More pages"}
                  className={styles.moreMenu}
                  onCloseAutoFocus={(event) => {
                    if (preferenceRequested.current) {
                      event.preventDefault();
                      preferenceRequested.current = false;
                    }
                  }}
                  sideOffset={4}
                >
                  {secondaryDestinations.map((destination) => {
                    return (
                      <DropdownMenuItem asChild key={destination.id}>
                        <DealerNavigationLink
                          aria-current={
                            isDestinationActive(destination)
                              ? "page"
                              : undefined
                          }
                          className={styles.moreItem}
                          data-marketplace-mode={destination.id}
                          href={getLocalizedPublicPath(
                            locale,
                            destination.path
                          )}
                        >
                          {destination.label}
                        </DealerNavigationLink>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a
                      aria-label={preferenceLabel}
                      className={styles.moreItem}
                      data-locale-trigger
                      href={preferenceHref}
                      onClick={(event) => {
                        if (
                          preferences &&
                          event.button === 0 &&
                          !event.ctrlKey &&
                          !event.metaKey &&
                          !event.shiftKey &&
                          !event.altKey
                        ) {
                          event.preventDefault();
                          preferenceRequested.current = true;
                          moreTrigger.current?.focus({ preventScroll: true });
                          setMoreOpen(false);
                          preferences.open();
                        }
                      }}
                    >
                      <LanguageFlag locale={preferenceLocale} />
                      {preferenceLabel}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
