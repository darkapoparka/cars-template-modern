import { Bike, BusFront, type LucideIcon, Truck } from "lucide-react";
import { createElement } from "react";
import { hugeiconsHeader } from "../lib/icons/hugeicons-header";

const categoryIconName = (icon: LucideIcon) => {
  if (icon === Bike) {
    return "bike";
  }
  if (icon === Truck) {
    return "truck";
  }
  if (icon === BusFront) {
    return "van";
  }
  return "car";
};

export function DealerMobileHeaderIcon({
  icon,
  kind,
}: {
  readonly icon: LucideIcon;
  readonly kind: "category" | "filters" | "info" | "location" | "phone";
}) {
  const name = kind === "category" ? categoryIconName(icon) : kind;
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      data-header-icon={kind}
      data-icon-family="hugeicons-stroke-rounded"
      fill="none"
      focusable="false"
      height={24}
      viewBox="0 0 24 24"
      width={24}
    >
      {hugeiconsHeader[name].map(([tag, attributes]) =>
        createElement(tag, { ...attributes, strokeWidth: 1.75 })
      )}
    </svg>
  );
}
