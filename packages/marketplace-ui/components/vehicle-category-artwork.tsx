import { cn } from "@repo/design-system/lib/utils";
import type { VehicleCategory } from "@repo/marketplace";
import Image from "next/image";

type ArtworkCategory = Exclude<VehicleCategory, "lease">;

const categoryArtworkPaths: Record<ArtworkCategory, string> = {
  car: "/images/categories/day-night-category-car-v2.png",
  motorbike: "/images/categories/day-night-category-motorbike-v1.png",
  truck: "/images/categories/day-night-category-truck-v1.png",
  van: "/images/categories/day-night-category-van-v1.png",
};

export const VehicleCategoryArtwork = ({
  category,
  className,
  sizes = "128px",
}: {
  category: VehicleCategory;
  className?: string;
  sizes?: string;
}) => {
  const src =
    category === "lease"
      ? categoryArtworkPaths.car
      : categoryArtworkPaths[category];

  return (
    <span aria-hidden="true" className={cn("block", className)}>
      <Image
        alt=""
        className="h-full w-full select-none object-contain"
        data-slot="lead-category-image"
        draggable={false}
        height={400}
        sizes={sizes}
        src={src}
        width={640}
      />
    </span>
  );
};
