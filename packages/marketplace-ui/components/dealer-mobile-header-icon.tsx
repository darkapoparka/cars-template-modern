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
  bike: "/images/services/header-motorbike-silver-v1.png",
  truck: "/images/services/header-truck-silver-v1.png",
  van: "/images/services/header-van-silver-v1.png",
  guides: "/images/services/header-guides-v1.png",
  filters: "/images/services/header-filters-v1.png",
  info: "/images/services/header-info-v1.png",
  location: "/images/services/header-location-v1.png",
  phone: "/images/services/header-phone-v4.png",
};

// Balance the visible silhouettes, including each image's transparent margins.
// The surrounding 44px hit target and 36px artwork frame stay identical.
const artworkSize = {
  car: "size-[30px]",
  bike: "size-9",
  truck: "size-9",
  van: "size-9",
  filters: "size-7",
  info: "size-[30px]",
  location: "size-[30px]",
  phone: "size-[30px]",
  guides: "size-[30px]",
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
      data-header-icon={kind}
      data-icon-family="silver-header-artwork"
    >
      <Image
        alt=""
        className={`${artworkSize[name]} select-none object-contain`}
        draggable={false}
        height={36}
        sizes="36px"
        src={artworkPaths[name]}
        width={36}
      />
      {kind === "category" ? (
        <ChevronDown
          className="absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2"
          strokeWidth={2}
        />
      ) : null}
    </span>
  );
}
