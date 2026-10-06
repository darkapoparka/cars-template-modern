import { withBasePath } from "@repo/internationalization/paths";
import { publicSite } from "@repo/marketplace/site-config";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { preload } from "react-dom";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-hero.module.css";
import { DesktopActionPanel } from "./desktop-action-panel";

export interface DealerDesktopHeroProps {
  appearance?: "banner" | "photo";
  artwork?: string;
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  loading?: boolean;
  locale?: string;
  sceneTone?: "standard" | "quiet";
  title: string;
  variant?: "landing" | "inventory" | "page" | "compact" | "service";
}

/** One desktop masthead surface. Pages supply context; mobile keeps its own chrome. */
export function DealerDesktopHero({
  appearance,
  artwork,
  locale,
  title,
  description,
  eyebrow,
  loading = false,
  sceneTone = "standard",
  variant = "page",
  children,
}: DealerDesktopHeroProps) {
  if (artwork) {
    preload(withBasePath(artwork), {
      as: "image",
      fetchPriority: "high",
      media: "(min-width: 1024px)",
    });
  }
  const isLanding = variant === "landing";
  const titleId = isLanding ? "desktop-home-title" : "desktop-page-title";
  const heading = (
    <div className={styles.copy}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={loading ? styles.loadingTitle : undefined} id={titleId}>
        {title}
      </h1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
  const content =
    variant === "service" ? (
      <div className={styles.serviceContent}>{children}</div>
    ) : (
      children
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
      {isLanding ? (
        heading
      ) : (
        <div className={styles.banner} data-slot="dealer-desktop-hero-banner">
          <nav
            aria-label={locale?.startsWith("bg") ? "Навигация" : "Breadcrumb"}
            className={styles.breadcrumb}
          >
            <Link href={getLocalizedPublicPath(locale, "/")}>
              {locale?.startsWith("bg") ? "Начало" : "Home"}
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{title}</span>
          </nav>
          {heading}
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
        content
      )}
    </section>
  );
}
