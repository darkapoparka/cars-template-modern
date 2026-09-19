import styles from "./dealer-desktop-discovery.module.css";
import { DealerDesktopHero } from "./dealer-desktop-hero";
import { DealerDesktopServiceLinks } from "./dealer-desktop-service-links";
import type { DealerDesktopToolbarProps } from "./dealer-desktop-toolbar";
import { DealerDesktopToolbar } from "./dealer-desktop-toolbar";

export function DealerDesktopDiscoveryHero({
  locale,
  totalListings,
  ...toolbarProps
}: DealerDesktopToolbarProps) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const count = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US").format(
    totalListings
  );
  return (
    <DealerDesktopHero
      description={
        isBg
          ? `Разгледайте и сравнете ${count} автомобила.`
          : `Explore and compare ${count} vehicles.`
      }
      title={isBg ? "Намерете своя автомобил." : "Find Your Next Drive"}
      variant="landing"
    >
      <div className={styles.heroSearch}>
        <DealerDesktopToolbar
          {...toolbarProps}
          locale={locale}
          totalListings={totalListings}
          variant="hero"
        />
      </div>
      <DealerDesktopServiceLinks locale={locale} placement="hero" />
    </DealerDesktopHero>
  );
}
