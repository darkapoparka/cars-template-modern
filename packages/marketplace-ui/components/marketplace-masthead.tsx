// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: The shared masthead intentionally supports compact/discovery and marketplace/dealer variants.

"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@repo/design-system/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { leadSite } from "@repo/marketplace";
import {
  ArrowUpRight,
  Banknote,
  CarFront,
  CircleDollarSign,
  Globe2,
  Heart,
  Landmark,
  MapPin,
  Phone,
  Ship,
  Store,
  Tag,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import {
  marketplaceContentFrameClassName,
  marketplaceDiscoveryFrameClassName,
} from "../lib/marketplace-layout";
import { getLocalizedPublicPath } from "../lib/public-path";
import { DealerDesktopHeader } from "./dealer-desktop-header";
import { MarketplaceLocaleSwitchLink } from "./marketplace-locale-switch-link";

export type MarketplaceMode = "buy" | "sell" | "lease" | "imports";

interface MarketplaceMastheadProps {
  readonly activeMode?: MarketplaceMode | null;
  readonly appBaseUrl?: string;
  readonly className?: string;
  readonly contentFrameClassName?: string;
  readonly contextActions?: ReactNode;
  readonly dealerActive?: boolean;
  readonly homeHref?: string;
  readonly locale?: string;
  readonly onModeChange?: (mode: MarketplaceMode) => void;
  readonly variant?: "compact" | "discovery";
}

interface UtilityActionProps {
  active?: boolean;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}

interface DealerDirectoryActionProps {
  active?: boolean;
  href: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  tone?: "primary" | "secondary";
  tooltip: string;
}

const trailingSlashPattern = /\/$/;
const leadSiteMastheadBannerStyle = {
  backgroundColor: "#030303",
  backgroundImage:
    "radial-gradient(circle at 50% 145%, rgba(255, 255, 255, 0.1), transparent 54%)",
} as const;
const leadSiteModeArtwork: Record<MarketplaceMode, string> = {
  buy: "/lead-nav-inventory-v7.png",
  imports: "/lead-nav-import-v7.png",
  lease: "/lead-nav-finance-v2.png",
  sell: "/lead-nav-sell-v7.png",
};
const leadSiteModeArtworkScale: Record<MarketplaceMode, string> = {
  buy: "scale-[0.92]",
  imports: "scale-105",
  lease: "scale-90",
  sell: "scale-[0.78]",
};

const cleanBaseUrl = (baseUrl?: string) =>
  baseUrl?.replace(trailingSlashPattern, "") ?? "";

const getMastheadContentFrameClassName = (
  contentFrameClassName: string | undefined,
  isDiscovery: boolean
) => {
  if (contentFrameClassName) {
    return contentFrameClassName;
  }

  return isDiscovery
    ? marketplaceDiscoveryFrameClassName
    : marketplaceContentFrameClassName;
};

export const LeadSiteMark = ({
  className,
  sizes = "236px",
}: {
  className?: string;
  sizes?: string;
}) => {
  if (leadSite.staticDemoMode) {
    return (
      <span
        className={cn(
          "relative block h-[62px] w-[236px] shrink-0 overflow-hidden",
          className
        )}
      >
        <Image
          alt=""
          aria-hidden="true"
          className="object-contain object-left"
          fill
          priority
          sizes={sizes}
          src={leadSite.logoPath}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl",
        className
      )}
      style={{ boxShadow: `inset 0 -3px 0 ${leadSite.accent}` }}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="size-full object-contain"
        height={40}
        src={leadSite.logoPath}
        width={40}
      />
    </span>
  );
};

const UtilityAction = ({
  active,
  href,
  icon: Icon,
  label,
}: UtilityActionProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        aria-label={label}
        asChild
        className={cn(
          "size-11 rounded-full bg-card text-zinc-700 shadow-none hover:bg-card/80 hover:text-zinc-950",
          active &&
            "bg-foreground text-background hover:bg-foreground/90 hover:text-background"
        )}
        size="icon"
        variant="ghost"
      >
        <Link
          aria-current={active ? "page" : undefined}
          data-slot="marketplace-utility-action"
          href={href}
        >
          <Icon aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        </Link>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" sideOffset={6}>
      {label}
    </TooltipContent>
  </Tooltip>
);

const DealerDirectoryAction = ({
  active,
  href,
  icon,
  label,
  tone = "primary",
  tooltip,
}: DealerDirectoryActionProps) => {
  const Icon = icon ?? Store;
  const staticActionClassName =
    tone === "secondary"
      ? "bg-zinc-200 text-zinc-950 hover:bg-zinc-100 hover:text-zinc-950"
      : "bg-white text-zinc-950 hover:bg-zinc-100 hover:text-zinc-950";
  const actionClassName = leadSite.staticDemoMode
    ? staticActionClassName
    : "mr-2 bg-card text-foreground hover:bg-card/80";
  const staticIconClassName =
    tone === "secondary"
      ? "bg-zinc-300 text-zinc-700"
      : "bg-zinc-200 text-[var(--lead-site-accent)]";
  const iconClassName = leadSite.staticDemoMode
    ? staticIconClassName
    : "bg-[var(--lead-site-accent)] text-white";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          className={cn(
            "h-11 rounded-xl py-1 pr-4 pl-1.5 shadow-none transition-colors",
            actionClassName,
            leadSite.staticDemoMode && "w-36 justify-start",
            active &&
              !leadSite.staticDemoMode &&
              "bg-card text-foreground hover:bg-card/80 hover:text-foreground"
          )}
          variant="ghost"
        >
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={tooltip}
            data-slot="marketplace-dealer-action"
            href={href}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            target={href.startsWith("http") ? "_blank" : undefined}
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                iconClassName
              )}
            >
              <Icon aria-hidden="true" className="size-4" strokeWidth={2} />
            </span>
            <span className="font-semibold text-sm">{label}</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          leadSite.staticDemoMode &&
            "[&_svg]:!bg-white [&_svg]:!fill-white border border-zinc-200 bg-white text-zinc-950 shadow-lg"
        )}
        side="bottom"
        sideOffset={6}
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

const DealerNavigationAction = ({
  discovery,
  icon,
  ...action
}: DealerDirectoryActionProps & { discovery: boolean }) =>
  discovery || leadSite.staticDemoMode ? (
    <DealerDirectoryAction icon={icon} {...action} />
  ) : (
    <UtilityAction
      active={action.active}
      href={action.href}
      icon={icon ?? Store}
      label={action.tooltip}
    />
  );

const LeadContactGroup = ({ isBg }: { isBg: boolean }) => {
  const [openContact, setOpenContact] = useState<"location" | "phone" | null>(
    null
  );
  const setContactOpen = (contact: "location" | "phone", open: boolean) => {
    setOpenContact((current) => {
      if (open) {
        return contact;
      }

      return current === contact ? null : current;
    });
  };

  return (
    <div
      className="flex h-[52px] w-[220px] min-w-0 items-stretch gap-2 xl:w-[236px]"
      data-slot="lead-contact-group"
    >
      <HoverCard
        closeDelay={350}
        onOpenChange={(open) => setContactOpen("phone", open)}
        open={openContact === "phone"}
        openDelay={120}
      >
        <HoverCardTrigger asChild>
          <Button
            asChild
            className="hover:!bg-white/[0.09] hover:!text-white h-[52px] min-w-0 flex-1 gap-2 rounded-xl border border-white/[0.14] bg-white/[0.025] px-3 font-semibold text-compact-control text-white/80 shadow-none transition-colors duration-150 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-bright)] focus-visible:ring-inset data-[state=open]:bg-white/[0.09] data-[state=open]:text-white"
            variant="ghost"
          >
            <a
              aria-label={
                isBg
                  ? `Обадете се на ${leadSite.phoneDisplay}`
                  : `Call ${leadSite.phoneDisplay}`
              }
              data-slot="lead-phone-action"
              href={leadSite.phoneHref}
            >
              <Phone aria-hidden="true" className="size-5" strokeWidth={1.9} />
              <span>{isBg ? "Обади се" : "Call"}</span>
            </a>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[15rem] border-white/20 bg-zinc-950 p-4 text-white shadow-xl"
          data-slot="lead-phone-tooltip"
          side="bottom"
          sideOffset={4}
        >
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-white/60 text-xs">
                {isBg ? "Телефон" : "Phone"}
              </p>
              <p className="mt-1 font-semibold text-lg tabular-nums">
                {leadSite.phoneDisplay}
              </p>
            </div>
            <a
              aria-label={
                isBg
                  ? `Обадете се на ${leadSite.phoneDisplay}`
                  : `Call ${leadSite.phoneDisplay}`
              }
              className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/20 bg-zinc-800 px-3.5 font-semibold text-sm text-white shadow-sm transition-[background-color,border-color,box-shadow] duration-150 hover:border-white/30 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-bright)] focus-visible:ring-inset active:bg-zinc-600"
              data-slot="lead-phone-tooltip-action"
              href={leadSite.phoneHref}
            >
              {isBg ? "Обади се" : "Call"}
              <Phone aria-hidden="true" className="size-4" strokeWidth={2} />
            </a>
          </div>
        </HoverCardContent>
      </HoverCard>
      <HoverCard
        closeDelay={350}
        onOpenChange={(open) => setContactOpen("location", open)}
        open={openContact === "location"}
        openDelay={120}
      >
        <HoverCardTrigger asChild>
          <Button
            asChild
            className="hover:!bg-white/[0.09] hover:!text-white h-[52px] min-w-0 flex-1 gap-2 rounded-xl border border-white/[0.14] bg-white/[0.025] px-3 font-semibold text-compact-control text-white/80 shadow-none transition-colors duration-150 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-bright)] focus-visible:ring-inset data-[state=open]:bg-white/[0.09] data-[state=open]:text-white"
            variant="ghost"
          >
            <a
              aria-label={
                isBg
                  ? "Отворете адреса в Google Maps"
                  : "Open address in Google Maps"
              }
              data-slot="lead-location-action"
              href={leadSite.mapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              <MapPin aria-hidden="true" className="size-5" strokeWidth={1.9} />
              <span>{isBg ? "Шоурум" : "Showroom"}</span>
            </a>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent
          align="end"
          className="w-[17rem] border-white/20 bg-zinc-950 p-4 text-white shadow-xl"
          data-slot="lead-location-tooltip"
          side="bottom"
          sideOffset={4}
        >
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-sm">
                {leadSite.city}
                <span aria-hidden="true" className="px-1 text-white/40">
                  ·
                </span>
                {isBg ? "Студентски град" : "Studentski grad"}
              </p>
              <p className="mt-1 text-white/60 text-xs">{leadSite.address}</p>
            </div>
            <a
              aria-label={isBg ? "Отвори в Google Maps" : "Open in Google Maps"}
              className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/20 bg-zinc-800 px-3.5 font-semibold text-sm text-white shadow-sm transition-[background-color,border-color,box-shadow] duration-150 hover:border-white/30 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-bright)] focus-visible:ring-inset active:bg-zinc-600"
              data-slot="lead-location-tooltip-action"
              href={leadSite.mapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              {isBg ? "Отвори в Google Maps" : "Open in Google Maps"}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

const LocaleUtilityAction = ({
  label,
  locale,
}: {
  label: string;
  locale?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        asChild
        className="size-11 rounded-full bg-card text-zinc-700 shadow-none hover:bg-card/80 hover:text-zinc-950"
        size="icon"
        variant="ghost"
      >
        <MarketplaceLocaleSwitchLink label={label} locale={locale}>
          <Globe2
            aria-hidden="true"
            className="size-[22px]"
            strokeWidth={1.8}
          />
        </MarketplaceLocaleSwitchLink>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" sideOffset={6}>
      {label}
    </TooltipContent>
  </Tooltip>
);

const DiscoveryModeArtwork = ({
  active,
  mode,
}: {
  active: boolean;
  mode: MarketplaceMode;
}) => (
  <span
    aria-hidden="true"
    className="relative flex h-6 w-[52px] shrink-0 items-center justify-center overflow-hidden xl:h-8 xl:w-11"
    data-slot="marketplace-mode-artwork"
  >
    <Image
      alt=""
      aria-hidden="true"
      className={cn(
        "object-contain transition-opacity duration-150",
        leadSiteModeArtworkScale[mode],
        active ? "opacity-100" : "opacity-80"
      )}
      fill
      priority
      sizes="(min-width: 1280px) 44px, 52px"
      src={leadSiteModeArtwork[mode]}
    />
  </span>
);

export const MarketplaceMasthead = ({
  activeMode = "buy",
  appBaseUrl,
  className,
  contentFrameClassName,
  contextActions,
  dealerActive = false,
  homeHref,
  locale,
  onModeChange,
  variant = "compact",
}: MarketplaceMastheadProps) => {
  if (leadSite.staticDemoMode) {
    return (
      <DealerDesktopHeader
        activeMode={activeMode}
        homeHref={homeHref}
        locale={locale}
      />
    );
  }
  const appUrl = cleanBaseUrl(appBaseUrl);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const localizeLabel = (bg: string, en: string) => (isBg ? bg : en);
  const isDiscovery = variant === "discovery";
  const isStaticDiscovery = leadSite.staticDemoMode && isDiscovery;
  const interactiveModeSwitcher = Boolean(
    leadSite.staticDemoMode && isDiscovery && onModeChange
  );
  const resolvedContentFrameClassName = getMastheadContentFrameClassName(
    contentFrameClassName,
    isDiscovery
  );
  const resolvedHomeHref = homeHref ?? getLocalizedPublicPath(locale, "/");
  const localeSwitchLabel = isBg ? "English" : "Български";
  const showLocaleSwitch = !leadSite.staticDemoMode;
  const contactAction = {
    href: leadSite.phoneHref,
    icon: Phone,
    label: leadSite.phoneDisplay,
    tooltip: localizeLabel(
      `Обадете се на ${leadSite.phoneDisplay}`,
      `Call ${leadSite.phoneDisplay}`
    ),
  };
  const modes: {
    href: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    id: MarketplaceMode;
    label: string;
  }[] = [
    {
      id: "buy",
      label: leadSite.staticDemoMode
        ? localizeLabel("Купи", "Buy")
        : localizeLabel("Купи", "Buy"),
      href: getLocalizedPublicPath(locale, "/cars"),
      icon: CarFront,
    },
    {
      id: "sell",
      label: leadSite.staticDemoMode
        ? localizeLabel("Продай", "Sell")
        : localizeLabel("Продай", "Sell"),
      href: getLocalizedPublicPath(locale, "/sell"),
      icon: leadSite.staticDemoMode ? Banknote : Tag,
    },
    {
      id: "lease",
      label: leadSite.staticDemoMode
        ? localizeLabel("Финансиране", "Financing")
        : localizeLabel("Лизинг", "Lease"),
      href: getLocalizedPublicPath(locale, "/lease"),
      icon: leadSite.staticDemoMode ? Landmark : CircleDollarSign,
    },
    {
      id: "imports",
      label: localizeLabel("Внос", "Import"),
      href: getLocalizedPublicPath(locale, "/imports"),
      icon: Ship,
    },
  ];
  const visibleModes = leadSite.staticDemoMode
    ? modes.filter((mode) => mode.id !== "lease")
    : modes;

  const utilityActions: UtilityActionProps[] = leadSite.staticDemoMode
    ? []
    : [
        {
          href: appUrl ? `${appUrl}/saved` : "/saved",
          icon: Heart,
          label: isBg ? "Запазени" : "Saved",
        },
        {
          href: appUrl ? `${appUrl}/account` : "/account",
          icon: UserRound,
          label: isBg ? "Профил" : "Account",
        },
      ];
  let primaryNavigationLabel = "Primary marketplace modes";
  if (isBg) {
    primaryNavigationLabel = "Основни действия";
  } else if (leadSite.staticDemoMode) {
    primaryNavigationLabel = "Primary dealership navigation";
  }
  let mastheadHeightClassName = "h-20";
  if (isStaticDiscovery) {
    mastheadHeightClassName = "h-24";
  } else if (!isDiscovery) {
    mastheadHeightClassName = "h-[68px]";
  }

  return (
    <header
      className={cn(
        "z-50 hidden lg:block",
        isDiscovery ? "relative" : "sticky top-0",
        className,
        leadSite.staticDemoMode ? "bg-black text-white" : "bg-control/70"
      )}
      data-slot="marketplace-masthead"
      style={leadSite.staticDemoMode ? leadSiteMastheadBannerStyle : undefined}
    >
      <div
        className={cn(
          resolvedContentFrameClassName,
          "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-5",
          mastheadHeightClassName
        )}
      >
        <Link
          aria-label={isBg ? "Начало" : "Home"}
          className={cn(
            "flex w-fit shrink-0 items-center gap-2.5 rounded-lg bg-transparent shadow-none transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isStaticDiscovery ? "h-[76px] px-2" : "h-[52px] px-3.5",
            !leadSite.staticDemoMode && "hover:bg-card/80"
          )}
          data-slot="marketplace-home-link"
          href={resolvedHomeHref}
        >
          <span
            className="flex items-center gap-2.5"
            data-slot="marketplace-home-brand"
          >
            <LeadSiteMark
              className={
                isStaticDiscovery
                  ? "h-[72px] w-[220px] xl:w-[252px] min-[112rem]:w-[280px]"
                  : undefined
              }
              sizes={
                isStaticDiscovery
                  ? "(min-width: 1792px) 280px, (min-width: 1280px) 252px, 220px"
                  : undefined
              }
            />
            {leadSite.staticDemoMode ? null : (
              <span className="font-semibold text-xl tracking-tight">
                {leadSite.shortName}
              </span>
            )}
          </span>
        </Link>

        <nav
          aria-label={primaryNavigationLabel}
          className={cn(
            "flex min-w-0 items-stretch justify-center",
            isStaticDiscovery
              ? "h-[52px] max-w-full gap-1 rounded-xl border border-white/[0.14] bg-white/[0.025] p-1"
              : "gap-2",
            isDiscovery && !isStaticDiscovery && "gap-1",
            isDiscovery &&
              !leadSite.staticDemoMode &&
              "rounded-xl bg-zinc-100/95 p-0.5"
          )}
        >
          {visibleModes.map((mode) => {
            const Icon = mode.icon;
            const active = activeMode === mode.id;
            let activeModeClassName = "";
            if (active && leadSite.staticDemoMode && isStaticDiscovery) {
              activeModeClassName =
                "!bg-white/[0.11] text-white hover:!bg-white/[0.14] hover:!text-white xl:border-white/[0.14] xl:shadow-sm";
            } else if (active && leadSite.staticDemoMode) {
              activeModeClassName =
                "bg-white/[0.1] text-white hover:text-white";
            } else if (active) {
              activeModeClassName =
                "bg-card text-foreground hover:bg-card/90 hover:text-foreground";
            }
            const modeClassName = cn(
              "relative border border-transparent bg-transparent no-underline shadow-none transition-[background-color,border-color,color,box-shadow] duration-150 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-bright)] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              leadSite.staticDemoMode
                ? "hover:!bg-white/[0.06] hover:!text-white text-white/65"
                : "text-foreground/65 hover:bg-card/80 hover:text-foreground",
              isStaticDiscovery &&
                "h-full w-[84px] flex-col gap-0 rounded-lg px-1.5 py-1 xl:w-[128px] xl:flex-row xl:gap-1.5 xl:px-2",
              isDiscovery &&
                !isStaticDiscovery &&
                "h-16 min-w-24 flex-col gap-0 rounded-xl px-3 py-1",
              !isDiscovery && "h-12 min-w-28 gap-3 rounded-lg px-5",
              activeModeClassName
            );
            const modeContent = (
              <>
                {isDiscovery ? (
                  <DiscoveryModeArtwork active={active} mode={mode.id} />
                ) : (
                  <span className="grid size-8 place-items-center transition-colors">
                    <Icon
                      aria-hidden="true"
                      className="size-[22px]"
                      strokeWidth={active ? 2.2 : 1.9}
                    />
                  </span>
                )}
                <span
                  className={cn(
                    "font-semibold",
                    isStaticDiscovery &&
                      "text-meta leading-none xl:text-compact-control",
                    isDiscovery && !isStaticDiscovery && "text-compact-control",
                    !isDiscovery && "text-base leading-none"
                  )}
                  data-slot="marketplace-mode-label"
                >
                  {mode.label}
                </span>
              </>
            );

            if (interactiveModeSwitcher) {
              return (
                <Button
                  aria-pressed={active}
                  className={modeClassName}
                  data-marketplace-mode={mode.id}
                  data-slot="marketplace-mode-action"
                  key={mode.id}
                  onClick={() => onModeChange?.(mode.id)}
                  type="button"
                  variant="ghost"
                >
                  {modeContent}
                </Button>
              );
            }

            return (
              <Button
                asChild
                className={modeClassName}
                key={mode.id}
                variant="ghost"
              >
                <Link
                  aria-current={active ? "page" : undefined}
                  data-marketplace-mode={mode.id}
                  data-slot="marketplace-mode-action"
                  href={mode.href}
                >
                  {modeContent}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div
          className={cn(
            "flex min-w-0 items-center justify-end",
            isDiscovery ? "gap-1" : "gap-4"
          )}
        >
          {contextActions ? (
            <div className="mr-1 flex min-w-0 items-center gap-1">
              {contextActions}
            </div>
          ) : null}
          {leadSite.staticDemoMode ? (
            <LeadContactGroup isBg={isBg} />
          ) : (
            <DealerNavigationAction
              active={dealerActive}
              discovery={isDiscovery}
              {...contactAction}
            />
          )}
          {utilityActions.map((action) => (
            <UtilityAction key={action.label} {...action} />
          ))}
          {showLocaleSwitch ? (
            <LocaleUtilityAction label={localeSwitchLabel} locale={locale} />
          ) : null}
        </div>
      </div>
    </header>
  );
};
