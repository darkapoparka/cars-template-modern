import { cn } from "@repo/design-system/lib/utils";
import { publicSite } from "@repo/marketplace/site-config";
import Image from "next/image";
import type { ComponentProps } from "react";
import styles from "./dealer-desktop-discovery.module.css";
import { DealerDesktopToolbar } from "./dealer-desktop-toolbar";

type DiscoveryHeroProps = ComponentProps<typeof DealerDesktopToolbar>;

export const DealerDesktopDiscoveryHero = ({
  locale,
  totalListings,
  ...toolbarProps
}: DiscoveryHeroProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  return (
    <section className={styles.hero} data-slot="dealer-desktop-home-hero">
      <div className={styles.heroCopy}>
        <h1>{isBg ? "Вашият следващ автомобил." : "Your next car."}</h1>
        <p className={styles.heroAvailability}>
          {isBg
            ? `${numberFormatter.format(totalListings)} автомобила в наличност`
            : `${numberFormatter.format(totalListings)} vehicles in stock`}
        </p>
      </div>
      <div className={styles.heroStage}>
        <div aria-hidden="true" className={styles.heroVehicles}>
          <div className={cn(styles.heroVehicle, styles.heroVehicleLeft)}>
            <Image
              alt=""
              fetchPriority="high"
              fill
              loading="lazy"
              sizes="(min-width: 1600px) 480px, (min-width: 1024px) 32vw, 0px"
              src={publicSite.artwork.heroLeft}
            />
          </div>
          <div className={cn(styles.heroVehicle, styles.heroVehicleRight)}>
            <Image
              alt=""
              fetchPriority="high"
              fill
              loading="lazy"
              sizes="(min-width: 1600px) 480px, (min-width: 1024px) 32vw, 0px"
              src={publicSite.artwork.heroRight}
            />
          </div>
        </div>
        <div className={styles.heroSearch}>
          <DealerDesktopToolbar
            {...toolbarProps}
            locale={locale}
            totalListings={totalListings}
            variant="hero"
          />
        </div>
      </div>
    </section>
  );
};
