import {
  Bike,
  BusFront,
  ChevronDown,
  type LucideIcon,
  Truck,
} from "lucide-react";
import Image from "./public-image";

const artworkPaths = {
  car: "/images/services/header-system-car-v3.webp",
  bike: "/images/services/header-system-bike-v3.webp",
  truck: "/images/services/header-system-truck-v3.webp",
  van: "/images/services/header-system-van-v3.webp",
  guides: "/images/services/header-system-guides-v3.webp",
  filters: "/images/services/header-system-filters-v3.webp",
  info: "/images/services/header-system-info-v3.webp",
  location: "/images/services/header-system-location-v3.webp",
  phone: "/images/services/header-system-phone-v3.webp",
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
  readonly kind:
    | "category"
    | "filters"
    | "guides"
    | "info"
    | "location"
    | "phone";
}) {
  const name = kind === "category" ? categoryIconName(icon) : kind;
  return (
    <span
      aria-hidden="true"
      className="relative grid size-9 place-items-center"
      data-header-artwork={name}
      data-header-icon={kind}
      data-icon-family="silver-header-artwork"
    >
      <Image
        alt=""
        // All nine assets share one normalized slot. Vehicle artwork clears
        // the fixed chevron through one shared 2px lift, never per-icon nudges.
        className={
          kind === "category"
            ? "size-7 -translate-y-0.5 select-none object-contain"
            : "size-7 select-none object-contain"
        }
        draggable={false}
        height={36}
        loading="eager"
        sizes="36px"
        src={artworkPaths[name]}
        // Delivery artwork is already sized at 4x its CSS slot.
        unoptimized
        width={36}
      />
      {kind === "category" ? (
        <ChevronDown
          className="absolute -bottom-0.5 left-1/2 size-2.5 -translate-x-1/2"
          strokeWidth={2}
        />
      ) : null}
    </span>
  );
}
