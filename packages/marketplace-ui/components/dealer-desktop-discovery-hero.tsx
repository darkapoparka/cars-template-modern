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
        <p className={styles.heroEyebrow}>
          {isBg
            ? `${numberFormatter.format(totalListings)} налични автомобила`
            : `${numberFormatter.format(totalListings)} vehicles available`}
        </p>
        <h1>
          {isBg
            ? "Открийте автомобила, който ви пасва."
            : "Find the car that fits your life."}
        </h1>
        <p className={styles.heroDescription}>
          {isBg
            ? "Подбрани предложения, ясни условия и всички важни детайли на едно място."
            : "Curated inventory, transparent terms, and every important detail in one place."}
        </p>
      </div>

      <div aria-hidden="true" className={styles.heroVehicles}>
        <div className={cn(styles.heroVehicle, styles.heroVehicleLeft)}>
          <Image
            alt=""
            fetchPriority="high"
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 52vw, 0px"
            src={publicSite.artwork.heroLeft}
          />
        </div>
        <div className={cn(styles.heroVehicle, styles.heroVehicleRight)}>
          <Image
            alt=""
            fetchPriority="high"
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 52vw, 0px"
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
    </section>
  );
};
