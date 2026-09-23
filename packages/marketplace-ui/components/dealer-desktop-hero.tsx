import type { ReactNode } from "react";
import { desktopBannerArtwork } from "../lib/desktop-banner-artwork";
import styles from "./dealer-desktop-hero.module.css";
import { DesktopActionPanel } from "./desktop-action-panel";
import Image from "./public-image";

export interface DealerDesktopHeroProps {
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  loading?: boolean;
  sceneTone?: "standard" | "quiet";
  title: string;
  variant?: "landing" | "page" | "compact" | "service";
}

/** One desktop masthead surface. Pages supply context; mobile keeps its own chrome. */
export function DealerDesktopHero({
  title,
  description,
  eyebrow,
  loading = false,
  sceneTone = "standard",
  variant = "page",
  children,
}: DealerDesktopHeroProps) {
  const titleId =
    variant === "landing" ? "desktop-home-title" : "desktop-page-title";
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
      data-loading={loading || undefined}
      data-scene-tone={sceneTone}
      data-slot={
        variant === "landing"
          ? "dealer-desktop-home-hero"
          : "dealer-desktop-context-hero"
      }
      data-variant={variant}
    >
      <div aria-hidden="true" className={styles.scene}>
        <Image
          alt=""
          data-slot="desktop-hero-scene"
          fill
          sizes="(min-width: 1024px) 100vw, 0px"
          src={desktopBannerArtwork.service}
          unoptimized
        />
      </div>
      <div className={styles.copy}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={loading ? styles.loadingTitle : undefined} id={titleId}>
          {title}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
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
