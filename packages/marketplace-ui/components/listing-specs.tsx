import {
  formatBodyType,
  formatFuelType,
  formatMileage,
  type VehicleListing,
} from "@repo/marketplace";
import {
  BadgeCheck,
  CalendarDays,
  Car,
  Cog,
  Fuel,
  Gauge,
  Palette,
  Tag,
  Zap,
} from "lucide-react";

type ListingSpecsVariant = "summary" | "details" | "combined";

interface ListingSpecsProps {
  readonly listing: VehicleListing;
  readonly locale?: string;
  readonly variant?: ListingSpecsVariant;
}

const compactTransmissionLabels = {
  automatic: { bg: "Автоматик", en: "Automatic" },
  manual: { bg: "Ръчни", en: "Manual" },
  semi_automatic: { bg: "Полуавтоматик", en: "Semi-auto" },
} as const;

const formatPower = (enginePowerHp: number | undefined, isBg: boolean) => {
  if (!enginePowerHp) {
    return isBg ? "Не е посочена" : "Not provided";
  }

  return `${enginePowerHp} ${isBg ? "к.с." : "hp"}`;
};

const getSummarySpecItems = (
  listing: VehicleListing,
  locale: string | undefined,
  isBg: boolean
) => [
  {
    icon: CalendarDays,
    label: isBg ? "Година" : "Year",
    value: String(listing.spec.year),
  },
  {
    icon: Gauge,
    label: isBg ? "Пробег" : "Mileage",
    value: formatMileage(listing.spec.mileageValue, locale),
  },
  {
    icon: Fuel,
    label: isBg ? "Гориво" : "Fuel",
    value: formatFuelType(listing.spec.fuelType, locale),
  },
  {
    icon: Car,
    label: isBg ? "Купе" : "Body",
    value: formatBodyType(listing.spec.bodyType, locale),
  },
  {
    icon: Cog,
    label: isBg ? "Скорости" : "Gearbox",
    value:
      compactTransmissionLabels[listing.spec.transmission][isBg ? "bg" : "en"],
  },
  {
    icon: Zap,
    label: isBg ? "Мощност" : "Power",
    value: formatPower(listing.spec.enginePowerHp, isBg),
  },
];

const getDetailSpecItems = (listing: VehicleListing, isBg: boolean) => [
  {
    icon: Tag,
    label: isBg ? "Марка" : "Make",
    value: listing.spec.make,
  },
  {
    icon: Car,
    label: isBg ? "Модел" : "Model",
    value: listing.spec.model,
  },
  {
    icon: BadgeCheck,
    label: isBg ? "Версия" : "Trim",
    value: listing.spec.trim ?? (isBg ? "Не е посочена" : "Not provided"),
  },
  {
    icon: Palette,
    label: isBg ? "Цвят" : "Colour",
    value:
      listing.spec.colorExterior ?? (isBg ? "Не е посочен" : "Not provided"),
  },
];

const getCombinedSpecItems = (
  listing: VehicleListing,
  locale: string | undefined,
  isBg: boolean
) => {
  const items = [...getSummarySpecItems(listing, locale, isBg)];

  if (listing.spec.trim) {
    items.push({
      icon: BadgeCheck,
      label: isBg ? "Версия" : "Trim",
      value: listing.spec.trim,
    });
  }

  if (listing.spec.colorExterior) {
    items.push({
      icon: Palette,
      label: isBg ? "Цвят" : "Colour",
      value: listing.spec.colorExterior,
    });
  }

  return items;
};

const getSpecItems = (
  listing: VehicleListing,
  locale: string | undefined,
  variant: ListingSpecsVariant,
  isBg: boolean
) => {
  if (variant === "details") {
    return getDetailSpecItems(listing, isBg);
  }

  if (variant === "combined") {
    return getCombinedSpecItems(listing, locale, isBg);
  }

  return getSummarySpecItems(listing, locale, isBg);
};

export const ListingSpecs = ({
  listing,
  locale,
  variant = "summary",
}: ListingSpecsProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const items = getSpecItems(listing, locale, variant, isBg);
  let heading = isBg ? "Данни за автомобила" : "Vehicle information";

  if (variant === "details") {
    heading = isBg ? "Характеристики" : "Specifications";
  }
  let gridClassName = "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6";
  if (variant === "details") {
    gridClassName = "grid-cols-2 sm:grid-cols-4";
  } else if (variant === "combined") {
    gridClassName = "grid-cols-2";
  }
  const sectionSlot =
    variant === "details" ? "listing-specifications" : "listing-information";

  return (
    <section
      aria-label={heading}
      className="scroll-mt-24"
      data-slot={sectionSlot}
    >
      <h2
        className={
          variant === "combined"
            ? "sr-only"
            : "mb-3 font-semibold text-card-title tracking-heading lg:text-card-title-lg"
        }
      >
        {heading}
      </h2>
      <dl
        className={`grid ${gridClassName} ${
          variant === "combined" ? "gap-2" : "gap-x-5 gap-y-1 lg:gap-2"
        }`}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const mobileCombined = variant === "combined";

          return (
            <div
              className={
                mobileCombined
                  ? "min-w-0 rounded-xl bg-zinc-100 px-3 py-3.5"
                  : "min-w-0 py-2.5 lg:min-h-[5.5rem] lg:rounded-lg lg:bg-control lg:px-3.5 lg:py-3.5"
              }
              data-slot="listing-specification"
              key={item.label}
            >
              <dt className="flex items-center gap-2 font-medium text-meta text-zinc-600 lg:text-foreground/80">
                <Icon
                  aria-hidden="true"
                  className="size-[18px] shrink-0 lg:size-[22px]"
                  strokeWidth={1.8}
                />
                <span>{item.label}</span>
              </dt>
              <dd
                className={
                  mobileCombined
                    ? "mt-1.5 break-words font-normal text-compact-control text-zinc-950 tabular-nums"
                    : "mt-1.5 break-words font-semibold text-compact-control text-zinc-950 tabular-nums lg:mt-3 lg:text-dialog-title lg:tracking-heading"
                }
              >
                {item.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
};
