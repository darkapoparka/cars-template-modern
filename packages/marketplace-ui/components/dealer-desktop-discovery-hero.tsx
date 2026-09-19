import { publicSite } from "@repo/marketplace/site-config";
import Image from "next/image";
import type { ComponentProps } from "react";
import styles from "./dealer-desktop-discovery.module.css";
import { DealerDesktopServiceLinks } from "./dealer-desktop-service-links";
import { DealerDesktopToolbar } from "./dealer-desktop-toolbar";

type DiscoveryHeroProps = ComponentProps<typeof DealerDesktopToolbar>;

export const DealerDesktopDiscoveryHero = ({
  locale,
  totalListings,
  ...toolbarProps
}: DiscoveryHeroProps) => {
  const isBg = locale?.startsWith("bg") ?? false;
  const count = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US").format(
    totalListings
  );
  return (
    <section className={styles.hero} data-slot="dealer-desktop-home-hero">
      <div aria-hidden="true" className={styles.scene}>
        {publicSite.artwork.heroScene ? (
          <Image
            alt=""
            data-slot="desktop-hero-scene"
            fetchPriority="high"
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 100vw, 0px"
            src={publicSite.artwork.heroScene}
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
      <div className={styles.heroCopy}>
        <h1>{isBg ? "Намерете своя автомобил." : "Find Your Next Drive"}</h1>
        <p>
          {isBg
            ? `${count} автомобила в наличност. Намерете своя.`
            : `${count} vehicles in stock. Find the one for you.`}
        </p>
      </div>
      <div className={styles.heroSearch}>
        <DealerDesktopToolbar
          {...toolbarProps}
          locale={locale}
          totalListings={totalListings}
          variant="hero"
        />
      </div>
      <DealerDesktopServiceLinks
        locale={locale}
        placement="hero"
        totalListings={totalListings}
      />
    </section>
  );
};
