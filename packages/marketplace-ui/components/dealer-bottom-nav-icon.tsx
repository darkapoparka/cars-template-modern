import { withBasePath } from "@repo/internationalization/paths";
import { createElement } from "react";
import { hugeiconsNavigation } from "../lib/icons/hugeicons-navigation";

const navigationArtwork: Partial<
  Record<keyof typeof hugeiconsNavigation, string>
> = {
  car: "/images/services/navigation-silver-car-v4.webp",
  import: "/images/services/navigation-silver-import-v4.webp",
  sell: "/images/services/navigation-silver-sell-v4.webp",
  lease: "/images/services/navigation-silver-lease-v4.webp",
  menu: "/images/services/navigation-silver-menu-v4.webp",
};

export function DealerBottomNavIcon({
  name,
  active = false,
}: {
  readonly name: keyof typeof hugeiconsNavigation;
  readonly active?: boolean;
}) {
  const artwork = navigationArtwork[name];
  if (artwork) {
    return (
      <span
        aria-hidden="true"
        className="block h-6 w-7.5 shrink-0"
        data-icon-family="generated-assets"
        data-nav-icon={name}
        style={{
          backgroundImage: `url(${withBasePath(artwork)})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    );
  }
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      data-icon-family="hugeicons-stroke-rounded"
      data-nav-icon={name}
      fill="none"
      focusable="false"
      height={24}
      viewBox="0 0 24 24"
      width={24}
    >
      {hugeiconsNavigation[name].map(([tag, attributes]) =>
        createElement(tag, { ...attributes, strokeWidth: active ? 1.9 : 1.5 })
      )}
    </svg>
  );
}
