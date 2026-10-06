import { withBasePath } from "@repo/internationalization/paths";
import { publicSite } from "@repo/marketplace/site-config";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { preload } from "react-dom";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-hero.module.css";
import { DesktopActionPanel } from "./desktop-action-panel";

export interface DealerDesktopHeroProps {
  actions?: readonly {
    external?: boolean;
    href: string;
    label: string;
    secondary?: boolean;
  }[];
  appearance?: "banner" | "photo" | "vehicles" | "neutral";
  artwork?: string;
  children?: ReactNode;
  controls?: ReactNode;
  eyebrow?: string;
  loading?: boolean;
  locale?: string;
  sceneTone?: "standard" | "quiet";
  title: string;
  variant?: "landing" | "inventory" | "page" | "compact" | "service";
}

function DesktopHeroActions({
  actions,
  locale,
}: Pick<DealerDesktopHeroProps, "actions" | "locale">) {
  const isBg = locale?.startsWith("bg");
  const defaultActions: NonNullable<DealerDesktopHeroProps["actions"]> =
    publicSite.services.buy
      ? [
          {
            href: getLocalizedPublicPath(locale, "/cars"),
            label: isBg ? "Разгледайте автомобилите" : "Explore cars",
          },
          {
            href: getLocalizedPublicPath(locale, "/contact"),
            label: isBg ? "Свържете се с нас" : "Get in touch",
            secondary: true,
          },
        ]
      : [
          {
            href: getLocalizedPublicPath(locale, "/contact"),
            label: isBg ? "Свържете се с нас" : "Get in touch",
          },
        ];
  return (
    <div className={styles.actions} data-slot="dealer-desktop-hero-actions">
      {(actions ?? defaultActions).map((action) => (
        <Link
          className={styles.action}
          data-secondary={action.secondary || undefined}
          href={action.href}
          key={action.href}
          rel={action.external ? "noreferrer" : undefined}
          target={action.external ? "_blank" : undefined}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}

function DesktopHeroVehicles({
  vehicles,
}: {
  vehicles: NonNullable<typeof publicSite.artwork.desktopDiscoveryVehicles>;
}) {
  for (const vehicle of Object.values(vehicles)) {
    preload(withBasePath(vehicle.src), {
      as: "image",
      fetchPriority: "high",
      media: "(min-width: 1200px)",
    });
  }
  return (
    <div
      aria-hidden="true"
      className={styles.vehicleScene}
      data-slot="dealer-desktop-hero-vehicles"
    >
      {(["left", "right"] as const).map((side) => {
        const vehicle = vehicles[side];
        return (
          <picture
            className={styles.vehicle}
            data-mirrored={vehicle.mirrored || undefined}
            data-side={side}
            key={side}
            style={
              {
                "--desktop-vehicle-baseline-ratio":
                  vehicle.baseline / vehicle.width,
              } as CSSProperties
            }
          >
            <source
              media="(min-width: 1200px)"
              srcSet={withBasePath(vehicle.src)}
            />
            <img
              alt=""
              decoding="async"
              height={vehicle.height}
              src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
              width={vehicle.width}
            />
          </picture>
        );
      })}
    </div>
  );
}

function DesktopHeroContent({
  children,
  variant,
}: Pick<DealerDesktopHeroProps, "children" | "variant">) {
  if (variant === "service") {
    return <div className={styles.serviceContent}>{children}</div>;
  }
  if (variant === "landing" || variant === "inventory") {
    return <div className={styles.discoveryControls}>{children}</div>;
  }
  return children;
}

/** One desktop masthead surface. Pages supply context; mobile keeps its own chrome. */
export function DealerDesktopHero({
  actions,
  appearance,
  artwork,
  locale,
  title,
  controls,
  eyebrow,
  loading = false,
  sceneTone = "standard",
  variant = "page",
  children,
}: DealerDesktopHeroProps) {
  const vehicles =
    appearance === "vehicles"
      ? publicSite.artwork.desktopDiscoveryVehicles
      : undefined;
  if (artwork) {
    preload(withBasePath(artwork), {
      as: "image",
      fetchPriority: "high",
      media: "(min-width: 1024px)",
    });
  }
  const isLanding = variant === "landing";
  const isDiscovery = isLanding || variant === "inventory";
  const titleId = isLanding ? "desktop-home-title" : "desktop-page-title";
  const heading = (
    <div className={styles.copy}>
      {eyebrow ? (
        <p className={styles.eyebrow} data-slot="dealer-desktop-hero-eyebrow">
          {eyebrow}
        </p>
      ) : null}
      <h1 className={loading ? styles.loadingTitle : undefined} id={titleId}>
        {title}
      </h1>
    </div>
  );
  return (
    <section
      aria-labelledby={titleId}
      className={styles.hero}
      data-appearance={appearance}
      data-loading={loading || undefined}
      data-scene-tone={sceneTone}
      data-slot={
        isLanding ? "dealer-desktop-home-hero" : "dealer-desktop-context-hero"
      }
      data-variant={variant}
      style={
        {
          ...(artwork
            ? { "--desktop-hero-scene": `url("${withBasePath(artwork)}")` }
            : {}),
          ...(publicSite.artwork.desktopPageBanner
            ? {
                "--desktop-page-car-left": `url("${withBasePath(publicSite.artwork.desktopPageBanner.left)}")`,
                "--desktop-page-car-right": `url("${withBasePath(publicSite.artwork.desktopPageBanner.right)}")`,
              }
            : {}),
        } as CSSProperties
      }
    >
      {vehicles && <DesktopHeroVehicles vehicles={vehicles} />}
      {isLanding ? (
        <div className={styles.discoveryHeading}>{heading}</div>
      ) : (
        <div
          className={styles.banner}
          data-has-actions={!isDiscovery || undefined}
          data-has-controls={Boolean(controls) || undefined}
          data-slot="dealer-desktop-hero-banner"
        >
          <div className={styles.discoveryHeading}>{heading}</div>
          {!isDiscovery &&
            (controls ?? (
              <DesktopHeroActions actions={actions} locale={locale} />
            ))}
        </div>
      )}
      {loading ? (
        <div aria-hidden="true" className={styles.loadingPanelFrame}>
          <DesktopActionPanel>
            <div className={styles.loadingFields}>
              <div />
              <div />
              <div />
              <div />
            </div>
          </DesktopActionPanel>
        </div>
      ) : (
        <DesktopHeroContent variant={variant}>{children}</DesktopHeroContent>
      )}
    </section>
  );
}
