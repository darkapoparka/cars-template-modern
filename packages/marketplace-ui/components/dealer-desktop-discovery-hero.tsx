import { publicSite } from "@repo/marketplace/site-config";
import styles from "./dealer-desktop-discovery.module.css";
import { DealerDesktopHero } from "./dealer-desktop-hero";
import {
  DealerHeroSearch,
  type DealerHeroSearchProps,
} from "./dealer-hero-search";

export function DealerDesktopDiscoveryHero({
  locale,
  ...toolbarProps
}: DealerHeroSearchProps & { totalListings: number }) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <DealerDesktopHero
      artwork={
        publicSite.artwork.desktopHeroScene ?? publicSite.artwork.heroScene
      }
      eyebrow={
        isBg
          ? "Нови и употребявани автомобили на едно място."
          : "Explore new and used cars, all in one place."
      }
      locale={locale}
      title={isBg ? "Намерете своя автомобил" : "Find Your Perfect Car"}
      variant="landing"
    >
      <div className={styles.heroSearch}>
        <DealerHeroSearch
          {...toolbarProps}
          compact
          locale={locale}
          surface="hero"
        />
      </div>
    </DealerDesktopHero>
  );
}
