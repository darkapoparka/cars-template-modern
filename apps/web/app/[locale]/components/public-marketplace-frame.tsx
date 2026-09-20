// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: The shared frame intentionally preserves marketplace and static dealer variants.

import { Button } from "@repo/design-system/components/ui/button";
import { withBasePath } from "@repo/internationalization/paths";
import { leadSite } from "@repo/marketplace";
import { getLeadCopy } from "@repo/marketplace/lead-copy";
import {
  isDealershipSite,
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import {
  DealerBottomNav,
  DealerMobileBrandBar,
  LeadSiteMark,
  MarketplaceLocaleSwitchLink,
  MarketplaceMasthead,
  type MarketplaceMode,
  MobileDealerChrome,
} from "@repo/marketplace-ui";
import {
  DealerDesktopHero,
  type DealerDesktopHeroProps,
} from "@repo/marketplace-ui/components/dealer-desktop-hero";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { Globe2, Heart, MapPin, Phone, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getPublicAppBaseUrl } from "@/lib/public-app-url";
import { Footer } from "./footer";
import { MobileDealerQuickActions } from "./mobile-dealer-quick-actions";

interface PublicMarketplaceFrameProps {
  activeMode?: MarketplaceMode | null;
  children: ReactNode;
  dealerActive?: boolean;
  desktopIntro?: Omit<DealerDesktopHeroProps, "children">;
  locale: string;
  mastheadVariant?: "compact" | "discovery";
  mobileDealerAction?: ReactNode;
  mobileDealerHeaderTone?: "clean" | "dark";
  mobileDealerIntro?: {
    description?: string;
    title: string;
  };
  mobileDealerQuickActions?: readonly {
    label: string;
    target: string;
  }[];
  showMobileBottomNav?: boolean;
  showMobileDealerHeader?: boolean;
  showMobileFooter?: boolean;
}

const marketplaceNavItems = [
  { bg: "Автомобили", en: "Cars", path: "/cars" },
  { bg: "Камиони", en: "Trucks", path: "/trucks" },
  { bg: "Бусове", en: "Vans", path: "/vans" },
  { bg: "Мотори", en: "Motorbikes", path: "/motorbikes" },
  { bg: "Лизинг", en: "Lease", path: "/lease" },
  { bg: "Съвети", en: "Guides", path: "/guides" },
] as const;

const dealerNavItems = [
  { bg: "Наличности", en: "Inventory", path: "/cars" },
  {
    bg: "Продай",
    en: "Sell",
    path: "/sell",
  },
  { bg: "Внос", en: "Import", path: "/imports" },
] as const;

export const PublicMarketplaceFrame = ({
  activeMode = null,
  children,
  dealerActive = false,
  desktopIntro,
  locale,
  mastheadVariant = "discovery",
  mobileDealerAction,
  mobileDealerHeaderTone = "dark",
  mobileDealerIntro,
  mobileDealerQuickActions,
  showMobileBottomNav = true,
  showMobileDealerHeader = true,
  showMobileFooter = true,
}: PublicMarketplaceFrameProps) => {
  const normalizedLocale = normalizeSeoLocale(locale);
  const isBg = normalizedLocale === "bg";
  const localizeLabel = (bg: string, en: string) => (isBg ? bg : en);
  const appBaseUrl = isDealershipSite ? "" : getPublicAppBaseUrl();
  const localize = (path: string) => getLocalizedPath(normalizedLocale, path);
  const navItems = (
    isDealershipSite ? dealerNavItems : marketplaceNavItems
  ).filter((item) => isPublicSitePathEnabled(item.path, publicSite));
  const savedActionLabel = isDealershipSite
    ? ""
    : localizeLabel("Запазени", "Saved");
  const primaryActionAriaLabel = isDealershipSite
    ? localizeLabel(
        `Обадете се на ${leadSite.phoneDisplay}`,
        `Call ${leadSite.phoneDisplay}`
      )
    : localizeLabel("Публикувай обява", "Sell a vehicle");
  const primaryActionLabel = isDealershipSite
    ? localizeLabel("Обади се", "Call")
    : localizeLabel("Публикувай", "Sell");
  return (
    <div
      className={
        isDealershipSite && showMobileBottomNav
          ? "flex min-h-screen flex-col break-words bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] text-foreground lg:pb-0"
          : "flex min-h-screen flex-col break-words bg-background text-foreground"
      }
    >
      <a
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-lg bg-foreground px-4 py-3 font-semibold text-background shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        href="#main-content"
      >
        {isBg ? "Към основното съдържание" : "Skip to main content"}
      </a>
      <MarketplaceMasthead
        activeMode={activeMode}
        appBaseUrl={appBaseUrl}
        dealerActive={dealerActive}
        homeHref={localize("/")}
        locale={normalizedLocale}
        variant={mastheadVariant}
      />

      {isDealershipSite && showMobileDealerHeader ? (
        <>
          <header
            className={
              mobileDealerHeaderTone === "clean"
                ? "bg-white text-zinc-950 lg:hidden"
                : "bg-black text-white lg:hidden"
            }
          >
            <MobileDealerChrome
              brandRow={
                <DealerMobileBrandBar
                  isBg={isBg}
                  locale={normalizedLocale}
                  tone={mobileDealerHeaderTone}
                />
              }
            />
            {mobileDealerIntro ? (
              <div
                className={
                  mobileDealerAction
                    ? "px-4 pt-3 pb-4 text-center"
                    : "px-6 pt-3 pb-5 text-center"
                }
              >
                <h1 className="mx-auto max-w-sm text-balance font-semibold text-[1.625rem] leading-[1.12] tracking-[-0.025em]">
                  {mobileDealerIntro.title}
                </h1>
                {mobileDealerIntro.description ? (
                  <p className="mx-auto mt-2 max-w-sm text-[0.875rem] text-white/70 leading-5">
                    {mobileDealerIntro.description}
                  </p>
                ) : null}
                {mobileDealerAction ? (
                  <div className="mx-auto mt-3 max-w-sm">
                    {mobileDealerAction}
                  </div>
                ) : null}
              </div>
            ) : null}
            {!mobileDealerIntro && mobileDealerAction ? (
              <div className="px-3 pb-3 sm:px-4">{mobileDealerAction}</div>
            ) : null}
          </header>

          {mobileDealerQuickActions?.length ? (
            <MobileDealerQuickActions
              ariaLabel={isBg ? "Бързи полета" : "Quick fields"}
              items={mobileDealerQuickActions}
            />
          ) : null}
        </>
      ) : null}

      <header
        className={
          isDealershipSite
            ? "hidden"
            : "sticky top-0 z-40 border-border border-b bg-card/95 backdrop-blur-xl lg:hidden"
        }
      >
        <div className="mx-auto flex min-h-16 max-w-[90rem] flex-wrap items-center gap-2 px-3 py-2 sm:px-4 lg:px-6">
          <Link
            aria-label={isBg ? "Начало" : "Home"}
            className="-ml-1 flex min-h-11 min-w-11 items-center gap-2 rounded-xl px-1 font-semibold tracking-tight transition-colors hover:bg-control focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)]"
            data-slot="marketplace-home-link"
            href={localize("/")}
          >
            <span
              className="flex items-center gap-2"
              data-slot="marketplace-home-brand"
            >
              <LeadSiteMark className="size-9 rounded-lg" />
              <span className="hidden min-[360px]:inline">
                {leadSite.shortName}
              </span>
            </span>
          </Link>

          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1.5">
            {isDealershipSite ? null : (
              <Button
                asChild
                className="hidden h-10 rounded-lg md:inline-flex focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)]"
                size="sm"
                variant="secondary"
              >
                <Link href={`${appBaseUrl}/saved`}>
                  <Heart aria-hidden="true" className="h-4 w-4" />
                  {savedActionLabel}
                </Link>
              </Button>
            )}
            {isDealershipSite ? (
              <Button
                asChild
                className="h-10 w-10 rounded-lg border border-border bg-control text-foreground shadow-none hover:bg-control-hover min-[340px]:w-24 min-[340px]:justify-start focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)]"
                size="sm"
                variant="secondary"
              >
                <a
                  aria-label={localizeLabel(
                    `Отворете адреса в Google Maps: ${getLeadCopy(locale).address}, ${getLeadCopy(locale).city}`,
                    `Open in Google Maps: ${getLeadCopy(locale).address}, ${getLeadCopy(locale).city}`
                  )}
                  href={withBasePath(leadSite.mapsUrl)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden min-[340px]:inline">
                    {getLeadCopy(locale).city}
                  </span>
                </a>
              </Button>
            ) : null}
            {isDealershipSite ? null : (
              <Button
                asChild
                className="h-10 min-w-10 rounded-lg focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)]"
                size="sm"
                variant="secondary"
              >
                <MarketplaceLocaleSwitchLink
                  label={isBg ? "English" : "Български"}
                  locale={normalizedLocale}
                >
                  <Globe2 aria-hidden="true" className="h-4 w-4" />
                  <span>{isBg ? "EN" : "BG"}</span>
                </MarketplaceLocaleSwitchLink>
              </Button>
            )}
            <Button
              asChild
              className={`h-10 min-w-10 focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)] ${
                isDealershipSite
                  ? "w-10 min-[340px]:w-24 min-[340px]:justify-start"
                  : ""
              }`}
              size="sm"
            >
              <Link
                aria-label={primaryActionAriaLabel}
                href={isDealershipSite ? leadSite.phoneHref : localize("/sell")}
              >
                {isDealershipSite ? (
                  <Phone aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Plus aria-hidden="true" className="h-4 w-4" />
                )}
                <span
                  className={
                    isDealershipSite
                      ? "hidden min-[340px]:inline"
                      : "hidden min-[300px]:inline"
                  }
                >
                  {primaryActionLabel}
                </span>
              </Link>
            </Button>
          </div>
        </div>
        <nav
          aria-label={isBg ? "Категории" : "Categories"}
          className="no-scrollbar flex w-full max-w-full gap-1 overflow-x-auto overscroll-x-contain border-border border-t px-3 py-2"
        >
          {navItems.map((item) => (
            <Button
              asChild
              className="h-10 focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)]"
              key={item.path}
              size="sm"
              variant="secondary"
            >
              <Link
                href={
                  item.path.startsWith("/") ? localize(item.path) : item.path
                }
              >
                {isBg ? item.bg : item.en}
              </Link>
            </Button>
          ))}
        </nav>
      </header>

      <div
        className="flex-1 scroll-mt-32 lg:scroll-mt-0"
        id="main-content"
        tabIndex={-1}
      >
        {desktopIntro ? <DealerDesktopHero {...desktopIntro} /> : null}
        {children}
      </div>

      <div className={showMobileFooter ? undefined : "max-lg:hidden"}>
        <Footer locale={normalizedLocale} />
      </div>
      {isDealershipSite && showMobileBottomNav ? (
        <DealerBottomNav activeMode={activeMode} locale={normalizedLocale} />
      ) : null}
    </div>
  );
};
