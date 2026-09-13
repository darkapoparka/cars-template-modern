import {
  Bike,
  BusFront,
  ChevronDown,
  type LucideIcon,
  Truck,
} from "lucide-react";
import Image from "next/image";

const artworkPaths = {
  car: "/images/services/header-car-v1.png",
  bike: "/images/categories/day-night-category-motorbike-v1.png",
  truck: "/images/categories/day-night-category-truck-v1.png",
  van: "/images/categories/day-night-category-van-v1.png",
  filters: "/images/services/header-filters-v1.png",
  info: "/images/services/header-info-v1.png",
  location: "/images/services/header-location-v1.png",
  phone: "/images/services/header-phone-v2.png",
};

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
    <span
      aria-hidden="true"
      className="relative grid size-9 place-items-center"
      data-header-icon={kind}
      data-icon-family="silver-header-artwork"
    >
      <Image
        alt=""
        className={
          kind === "category"
            ? "size-9 object-contain"
            : "size-8 object-contain"
        }
        draggable={false}
        height={36}
        sizes="36px"
        src={artworkPaths[name]}
        width={36}
      />
      {kind === "category" ? (
        <ChevronDown
          className="absolute right-0 bottom-0 size-2.5"
          strokeWidth={2}
        />
      ) : null}
    </span>
  );
}
