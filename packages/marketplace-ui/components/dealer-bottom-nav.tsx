"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import { cn } from "@repo/design-system/lib/utils";
import {
  buildMarketplaceSearchHref,
  defaultVehicleCategory,
  getCategoryPath,
  leadSite,
  type MarketplaceSearchParams,
} from "@repo/marketplace";
import { CircleDollarSign, Heart, Plus, Store, User } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import { isBuyMarketplaceCategory } from "../lib/marketplace-navigation";
import { getLocalizedPublicPath } from "../lib/public-path";
import { DealerBottomNavIcon } from "./dealer-bottom-nav-icon";
import { DealerMobileBrandBar } from "./dealer-mobile-brand-bar";
import { DealerSocialLinks } from "./dealer-social-links";
import { DealerUiIcon } from "./dealer-ui-icon";
import type { MarketplaceMode } from "./marketplace-masthead";
import { mobileMarketplaceDrawerIconActionClassName } from "./mobile-marketplace-drawer";

const getDealerNavigationItemClassName = (active: boolean) =>
  cn(
    "relative flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[12px] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]",
    active
      ? "font-semibold text-[var(--lead-site-accent)]"
      : "font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 active:bg-zinc-100"
  );

export const DealerBottomNav = ({
  activeMode,
  locale,
}: {
  activeMode?: MarketplaceMode | null;
  locale?: string;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const navigationLabel = isBg
    ? "Навигация на автокъщата"
    : "Dealership navigation";
  const items = [
    {
      active: activeMode === "buy",
      href: buildMarketplaceSearchHref(
        { category: defaultVehicleCategory },
        getLocalizedPublicPath(locale, getCategoryPath(defaultVehicleCategory))
      ),
      icon: "car" as const,
      label: isBg ? "Коли" : "Cars",
    },
    {
      active: activeMode === "imports",
      href: getLocalizedPublicPath(locale, "/imports"),
      icon: "import" as const,
      label: isBg ? "Внос" : "Import",
    },
    {
      active: activeMode === "sell",
      href: getLocalizedPublicPath(locale, "/sell"),
      icon: "sell" as const,
      label: isBg ? "Продай" : "Sell",
    },
    {
      active: activeMode === "lease",
      href: getLocalizedPublicPath(locale, "/lease"),
      icon: "lease" as const,
      label: isBg ? "Лизинг" : "Lease",
    },
  ];
  const menuLabel = isBg ? "Меню" : "Menu";
  const secondaryMenuItems = [
    {
      href: getLocalizedPublicPath(locale, "/cars"),
      icon: "car" as const,
      label: isBg ? "Всички автомобили" : "All vehicles",
    },
    {
      href: getLocalizedPublicPath(locale, "/guides"),
      icon: "guide" as const,
      label: isBg ? "Съвети за покупка" : "Buying guides",
    },
    {
      href: getLocalizedPublicPath(locale, "/contact"),
      icon: "about" as const,
      label: isBg ? "За нас и контакти" : "About and contact",
    },
  ];

  return (
    <>
      <nav
        aria-label={navigationLabel}
        className="fixed inset-x-0 bottom-0 z-40 border-zinc-200/70 border-t bg-white lg:hidden"
        data-slot="dealer-bottom-nav"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid min-h-[60px] max-w-lg grid-cols-5 px-1.5">
          {items.map((item) => {
            const visuallyActive = item.active && !menuOpen;

            return (
              <Link
                aria-current={item.active ? "page" : undefined}
                className={getDealerNavigationItemClassName(visuallyActive)}
                href={item.href}
                key={item.label}
              >
                <span className="grid h-8 w-10 place-items-center">
                  <DealerBottomNavIcon
                    active={visuallyActive}
                    name={item.icon}
                  />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          <button
            aria-controls="dealer-mobile-menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className={getDealerNavigationItemClassName(
              menuOpen || !activeMode
            )}
            onClick={() => setMenuOpen(true)}
            ref={menuTriggerRef}
            type="button"
          >
            <span className="grid h-8 w-10 place-items-center">
              <DealerBottomNavIcon
                active={menuOpen || !activeMode}
                name="menu"
              />
            </span>
            <span className="whitespace-nowrap">{menuLabel}</span>
          </button>
        </div>
      </nav>

      <Drawer modal onOpenChange={setMenuOpen} open={menuOpen}>
        <DrawerContent
          className="!bg-white mx-auto h-auto max-w-lg overflow-hidden border-0 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top)))] data-[vaul-drawer-direction=bottom]:rounded-t-3xl"
          data-slot="dealer-mobile-menu"
          id="dealer-mobile-menu"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(() =>
              menuTriggerRef.current?.focus({ preventScroll: true })
            );
          }}
        >
          <DrawerHeader className="shrink-0 px-5 pt-4 pb-4">
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3">
              <div>
                <DrawerTitle className="sr-only">{menuLabel}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {leadSite.name}
                </DrawerDescription>
              </div>
              <DealerMobileBrandBar
                isBg={isBg}
                locale={locale}
                onNavigate={() => setMenuOpen(false)}
                tone="clean"
                wordmarkTone="dark"
              />
              <Button
                aria-label={isBg ? "Затвори менюто" : "Close menu"}
                className={cn(
                  mobileMarketplaceDrawerIconActionClassName,
                  "bg-zinc-100"
                )}
                onClick={() => setMenuOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <DealerUiIcon className="size-[18px]" name="close" />
              </Button>
            </div>
          </DrawerHeader>

          <div
            className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            data-slot="dealer-mobile-menu-body"
          >
            <div
              className="grid grid-cols-2 gap-2"
              data-slot="dealer-mobile-menu-primary-actions"
            >
              <a
                aria-label={`${isBg ? "Обадете се на" : "Call"} ${leadSite.phoneDisplay}`}
                className="flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-2.5 py-3 text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-800"
                href={leadSite.phoneHref}
                onClick={() => setMenuOpen(false)}
              >
                <DealerUiIcon className="size-5 shrink-0" name="phone" />
                <span className="whitespace-nowrap font-semibold text-[14px] tabular-nums leading-5">
                  {isBg ? "Обади се" : "Call us"}
                </span>
              </a>
              <a
                aria-label={
                  isBg
                    ? `Отворете картата: ${leadSite.address}`
                    : "Open showroom map"
                }
                className="flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-2.5 py-3 text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-800"
                href={leadSite.mapsUrl}
                onClick={() => setMenuOpen(false)}
                rel="noreferrer"
                target="_blank"
              >
                <DealerUiIcon className="size-5 shrink-0" name="location" />
                <span className="min-w-0 text-center font-semibold text-[14px] leading-5">
                  {isBg ? "Посети ни" : "Visit us"}
                </span>
              </a>
            </div>

            <nav
              aria-label={isBg ? "Още страници" : "More pages"}
              className="mt-4 grid gap-2"
              data-slot="dealer-mobile-menu-secondary-nav"
            >
              {secondaryMenuItems.map((item) => {
                return (
                  <Link
                    className="flex min-h-14 items-center gap-3 rounded-xl bg-zinc-100 px-4 font-semibold text-[15px] text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-200"
                    href={item.href}
                    key={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    <DealerUiIcon
                      className="size-5 shrink-0 text-zinc-600"
                      name={item.icon}
                    />
                    <span className="min-w-0 flex-1 py-3">{item.label}</span>
                    <DealerUiIcon
                      className="size-4 shrink-0 text-zinc-400"
                      name="chevronRight"
                    />
                  </Link>
                );
              })}
            </nav>
            <DealerSocialLinks isBg={isBg} links={leadSite.socialLinks} />
            <p className="mt-4 text-[13px] text-zinc-600 leading-5">
              {leadSite.address}
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export const BottomMarketplaceNav = ({
  appBaseUrl,
  filters,
  locale,
}: {
  appBaseUrl: string;
  filters: MarketplaceSearchParams;
  locale?: string;
}) => {
  const copy = getMarketplaceControlCopy(locale);

  if (leadSite.staticDemoMode) {
    return (
      <DealerBottomNav
        activeMode={filters.category === "lease" ? "lease" : "buy"}
        locale={locale}
      />
    );
  }

  const items = [
    {
      href: buildMarketplaceSearchHref(
        { category: defaultVehicleCategory },
        getLocalizedPublicPath(locale, getCategoryPath(defaultVehicleCategory))
      ),
      icon: Store,
      label: copy.bottomNav.buy,
      active: isBuyMarketplaceCategory(filters.category),
    },
    {
      href: buildMarketplaceSearchHref(
        { category: "lease" },
        getLocalizedPublicPath(locale, getCategoryPath("lease"))
      ),
      icon: CircleDollarSign,
      label: copy.bottomNav.lease,
      active: filters.category === "lease",
    },
    {
      href: getLocalizedPublicPath(locale, "/sell"),
      icon: Plus,
      label: copy.bottomNav.sell,
      active: false,
    },
    {
      href: appBaseUrl ? `${appBaseUrl}/saved` : "/saved",
      icon: Heart,
      label: copy.bottomNav.saved,
      active: false,
    },
    {
      href: appBaseUrl ? `${appBaseUrl}/account` : "/account",
      icon: User,
      label: copy.bottomNav.account,
      active: false,
    },
  ];

  return (
    <nav
      aria-label={copy.bottomNav.navigation}
      className="fixed right-0 bottom-0 left-0 z-40 border-border border-t bg-background/95 backdrop-blur-xl lg:hidden"
      data-slot="marketplace-bottom-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex min-h-14 max-w-lg items-center px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 font-medium text-micro transition-colors",
                item.active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              href={item.href}
              key={item.label}
            >
              <Icon
                className="h-5 w-5"
                fill={item.active ? "currentColor" : "none"}
                strokeWidth={item.active ? 2.5 : 1.7}
              />
              <span className="max-w-full text-center leading-tight [overflow-wrap:anywhere]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
