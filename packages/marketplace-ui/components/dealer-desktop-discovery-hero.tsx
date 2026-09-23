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
      title={isBg ? "Намерете своя автомобил." : "Find Your Next Drive"}
      variant="landing"
    >
      <div className={styles.heroSearch}>
        <DealerHeroSearch {...toolbarProps} locale={locale} />
      </div>
    </DealerDesktopHero>
  );
}
