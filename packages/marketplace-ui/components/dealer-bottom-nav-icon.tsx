import { createElement } from "react";
import { hugeiconsNavigation } from "../lib/icons/hugeicons-navigation";

const navigationPositions: Partial<Record<keyof typeof hugeiconsNavigation, string>> = { car: "0%", import: "25%", sell: "50%", lease: "75%", menu: "100%" };

export function DealerBottomNavIcon({
  name,
  active = false,
}: {
  readonly name: keyof typeof hugeiconsNavigation;
  readonly active?: boolean;
}) {
  const position = navigationPositions[name];
  if (position !== undefined) {
    return (
      <span aria-hidden="true" className="block h-8 w-10 shrink-0" data-icon-family="generated-assets" data-nav-icon={name} style={{ backgroundImage: name === "sell" || name === "lease" ? "url(/images/services/navigation-assets-v2.png)" : "url(/images/services/navigation-assets-v1.png)", backgroundSize: "500% auto", backgroundPosition: `${position} 50%`, backgroundRepeat: "no-repeat" }} />
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
