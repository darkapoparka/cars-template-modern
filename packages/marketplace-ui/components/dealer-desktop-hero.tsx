import { publicSite } from "@repo/marketplace/site-config";
import type { ReactNode } from "react";
import styles from "./dealer-desktop-hero.module.css";
import Image from "./public-image";

export interface DealerDesktopHeroProps {
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
  variant?: "landing" | "page" | "compact";
}

/** One desktop masthead surface. Pages supply context; mobile keeps its own chrome. */
export function DealerDesktopHero({
  title,
  description,
  eyebrow,
  variant = "page",
  children,
}: DealerDesktopHeroProps) {
  const titleId =
    variant === "landing" ? "desktop-home-title" : "desktop-page-title";
  return (
    <section
      aria-labelledby={titleId}
      className={styles.hero}
      data-slot={
        variant === "landing"
          ? "dealer-desktop-home-hero"
          : "dealer-desktop-context-hero"
      }
      data-variant={variant}
    >
      {variant !== "compact" && (
        <div aria-hidden="true" className={styles.scene}>
          {publicSite.artwork.heroScene ? (
            <Image
              alt=""
              data-slot="desktop-hero-scene"
              fetchPriority={variant === "landing" ? "high" : "auto"}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 100vw, 0px"
              src={publicSite.artwork.heroScene}
              // Already optimized at source dimensions; preserve detail without another encode.
              unoptimized
            />
          ) : (
            <>
              <div className={styles.fallbackLeft}>
                <Image
                  alt=""
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 25vw, 0px"
                  src={publicSite.artwork.heroLeft}
                />
              </div>
              <div className={styles.fallbackRight}>
                <Image
                  alt=""
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 25vw, 0px"
                  src={publicSite.artwork.heroRight}
                />
              </div>
            </>
          )}
        </div>
      )}
      <div className={styles.copy}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 id={titleId}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children}
    </section>
  );
}
