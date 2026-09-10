import { Button } from "@repo/design-system/components/ui/button";
import { leadSite } from "@repo/marketplace";
import {
  LeadSiteMark,
  MarketplaceLocaleSwitchLink,
  marketplaceContentFrameClassName,
} from "@repo/marketplace-ui";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Globe2,
  MapPin,
} from "lucide-react";
import Link from "next/link";

interface FooterProps {
  readonly locale: string;
}

interface FooterLink {
  readonly accessibleLabel?: string;
  readonly external?: boolean;
  readonly href: string;
  readonly label: string;
}

interface FooterGroup {
  readonly links: readonly FooterLink[];
  readonly title: string;
}

const FooterNavigationLink = ({
  accessibleLabel,
  external,
  href,
  label,
}: FooterLink) => (
  <Link
    aria-label={accessibleLabel}
    className="group/link inline-flex min-h-8 w-fit items-center gap-1.5 py-1 text-background/75 text-meta transition-colors hover:text-background focus-visible:rounded-sm focus-visible:[outline-offset:3px] focus-visible:[outline:2px_solid_var(--ring)]"
    href={href}
    prefetch={false}
  >
    <span>{label}</span>
    {external ? (
      <ExternalLink
        aria-hidden="true"
        className="size-3.5 opacity-55 transition-opacity group-hover/link:opacity-100"
        strokeWidth={1.8}
      />
    ) : null}
  </Link>
);

const DesktopFooterGroup = ({ links, title }: FooterGroup) => (
  <section>
    <h2 className="mb-3 font-semibold text-background text-body">{title}</h2>
    <ul className="space-y-0.5">
      {links.map((link) => (
        <li key={`${title}-${link.label}-${link.href}`}>
          <FooterNavigationLink {...link} />
        </li>
      ))}
    </ul>
  </section>
);

const MobileFooterGroup = ({ links, title }: FooterGroup) => (
  <details className="group border-background/12 border-t first:border-t-0">
    <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between py-2 font-semibold text-background text-body focus-visible:rounded-sm focus-visible:[outline-offset:-2px] focus-visible:[outline:2px_solid_var(--ring)] [&::-webkit-details-marker]:hidden">
      {title}
      <ChevronDown
        aria-hidden="true"
        className="size-4 text-background/55 transition-transform group-open:rotate-180"
        strokeWidth={1.8}
      />
    </summary>
    <ul className="grid grid-cols-1 gap-0.5 pb-3">
      {links.map((link) => (
        <li key={`${title}-${link.label}-${link.href}`}>
          <FooterNavigationLink {...link} />
        </li>
      ))}
    </ul>
  </details>
);

const getStaticDemoFooterGroups = (
  isBg: boolean,
  localize: (path: string) => string
): readonly FooterGroup[] => {
  const emailLinks: FooterLink[] = leadSite.email
    ? [
        {
          accessibleLabel: isBg
            ? `Изпратете имейл на ${leadSite.email}`
            : `Email ${leadSite.email}`,
          external: true,
          href: `mailto:${leadSite.email}`,
          label: leadSite.email,
        },
      ]
    : [];

  return [
    {
      title: isBg ? "Наличности" : "Inventory",
      links: [
        {
          href: localize("/cars"),
          label: isBg ? "Всички автомобили" : "All vehicles",
        },
        {
          href: localize("/lease"),
          label: isBg ? "Финансиране" : "Financing",
        },
        {
          href: localize("/sell"),
          label: isBg ? "Продайте ни автомобил" : "Sell your car",
        },
      ],
    },
    {
      title: isBg ? "Помощ" : "Resources",
      links: [
        {
          href: localize("/guides"),
          label: isBg ? "Съвети за покупка" : "Buying guides",
        },
        {
          href: localize("/guides/dealer-listing-transparency"),
          label: isBg ? "Прозрачност на обявите" : "Listing transparency",
        },
        {
          href: localize("/contact"),
          label: isBg ? "За нас и контакти" : "About and contact",
        },
      ],
    },
    {
      title: isBg ? "Свържете се" : "Contact",
      links: [
        {
          accessibleLabel: isBg
            ? `Обадете се на ${leadSite.phoneDisplay}`
            : `Call ${leadSite.phoneDisplay}`,
          external: true,
          href: leadSite.phoneHref,
          label: leadSite.phoneDisplay,
        },
        ...emailLinks,
      ],
    },
  ];
};

const getFooterGroups = (
  isBg: boolean,
  localize: (path: string) => string
): readonly FooterGroup[] => getStaticDemoFooterGroups(isBg, localize);

const getFooterCtaLabel = (isBg: boolean) => (isBg ? "Обадете се" : "Call now");

export const Footer = ({ locale }: FooterProps) => {
  const normalizedLocale = normalizeSeoLocale(locale);
  const isBg = normalizedLocale === "bg";
  const localize = (path: string) => getLocalizedPath(normalizedLocale, path);
  const currentYear = new Date().getFullYear();

  const groups = getFooterGroups(isBg, localize);
  const ctaLabel = getFooterCtaLabel(isBg);

  return (
    <footer
      className={`border-foreground/10 border-t bg-foreground text-background ${
        leadSite.staticDemoMode ? "hidden lg:block" : ""
      }`}
      data-slot="public-marketplace-footer"
    >
      <div className={marketplaceContentFrameClassName}>
        <div className="grid gap-8 py-9 md:grid-cols-[minmax(13rem,1.15fr)_minmax(0,2.5fr)] md:gap-12 lg:py-11">
          <div className="max-w-sm">
            <Link
              aria-label={
                isBg ? `${leadSite.name} начало` : `${leadSite.name} home`
              }
              className="inline-flex items-center gap-2.5 rounded-sm focus-visible:[outline-offset:4px] focus-visible:[outline:2px_solid_var(--ring)]"
              href={localize("/")}
              prefetch={false}
            >
              <LeadSiteMark />
              {leadSite.staticDemoMode ? null : (
                <span className="font-semibold text-background text-lg tracking-tight">
                  {leadSite.name}
                </span>
              )}
            </Link>

            <p className="mt-4 max-w-xs text-background/75 text-body">
              {leadSite.tagline}
            </p>

            <div className="mt-5 flex items-start gap-2 text-background/75 text-meta">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-[var(--lead-site-accent-bright)]"
                strokeWidth={1.8}
              />
              <span>
                {leadSite.address}, {leadSite.city}, {leadSite.country}
              </span>
            </div>

            <Button
              asChild
              className="mt-5 h-11 bg-[var(--lead-site-accent)] px-4 font-semibold text-body text-white shadow-none hover:bg-[var(--lead-site-accent-hover)]"
              size="sm"
            >
              <Link href={leadSite.phoneHref} prefetch={false}>
                {ctaLabel}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>

          <nav
            aria-label={isBg ? "Връзки в долната част" : "Footer navigation"}
            className={`hidden grid-cols-2 gap-x-8 gap-y-8 md:grid ${
              leadSite.staticDemoMode ? "lg:grid-cols-3" : "lg:grid-cols-4"
            }`}
          >
            {groups.map((group) => (
              <DesktopFooterGroup {...group} key={group.title} />
            ))}
          </nav>

          <nav
            aria-label={isBg ? "Връзки в долната част" : "Footer navigation"}
            className="border-background/12 border-y md:hidden"
          >
            {groups.map((group) => (
              <MobileFooterGroup {...group} key={group.title} />
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-background/12 border-t py-4 text-background/65 text-micro sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {leadSite.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {leadSite.staticDemoMode ? (
              <>
                <Link
                  className="inline-flex min-h-8 items-center transition-colors hover:text-background focus-visible:rounded-sm focus-visible:[outline-offset:3px] focus-visible:[outline:2px_solid_var(--ring)]"
                  href={leadSite.phoneHref}
                  prefetch={false}
                >
                  {leadSite.phoneDisplay}
                </Link>
                {leadSite.email ? (
                  <Link
                    className="inline-flex min-h-8 items-center transition-colors hover:text-background focus-visible:rounded-sm focus-visible:[outline-offset:3px] focus-visible:[outline:2px_solid_var(--ring)]"
                    href={`mailto:${leadSite.email}`}
                    prefetch={false}
                  >
                    {leadSite.email}
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <Link
                  className="inline-flex min-h-8 items-center transition-colors hover:text-background focus-visible:rounded-sm focus-visible:[outline-offset:3px] focus-visible:[outline:2px_solid_var(--ring)]"
                  href={localize("/legal/privacy")}
                  prefetch={false}
                >
                  {isBg ? "Поверителност" : "Privacy"}
                </Link>
                <Link
                  className="inline-flex min-h-8 items-center transition-colors hover:text-background focus-visible:rounded-sm focus-visible:[outline-offset:3px] focus-visible:[outline:2px_solid_var(--ring)]"
                  href={localize("/legal/terms")}
                  prefetch={false}
                >
                  {isBg ? "Условия" : "Terms"}
                </Link>
              </>
            )}
            {leadSite.staticDemoMode ? null : (
              <MarketplaceLocaleSwitchLink
                className="inline-flex min-h-8 items-center gap-1.5 transition-colors hover:text-background focus-visible:rounded-sm focus-visible:[outline-offset:3px] focus-visible:[outline:2px_solid_var(--ring)]"
                label={
                  isBg
                    ? "Смени езика на сайта — долна част"
                    : "Switch site language — footer"
                }
                locale={normalizedLocale}
              >
                <Globe2
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.8}
                />
                <span>{isBg ? "English" : "Български"}</span>
              </MarketplaceLocaleSwitchLink>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
