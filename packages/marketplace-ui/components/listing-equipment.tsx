import type { VehicleListing } from "@repo/marketplace";
import {
  AirVent,
  Camera,
  Check,
  CheckCircle2,
  MonitorUp,
  Sun,
} from "lucide-react";

interface ListingEquipmentProps {
  readonly listing: VehicleListing;
  readonly locale?: string;
  readonly variant?: "default" | "mobile";
}

const cameraFeaturePattern = /360|камер|camera/;
const panoramicFeaturePattern = /панорам|panoram|roof|покрив/;
const displayFeaturePattern = /head-up|hud|display|дисплей/;
const ventilationFeaturePattern = /обдух|ventilat|seat|седал/;

const getFeatureIcon = (label: string) => {
  const normalizedLabel = label.toLocaleLowerCase();

  if (cameraFeaturePattern.test(normalizedLabel)) {
    return Camera;
  }

  if (panoramicFeaturePattern.test(normalizedLabel)) {
    return Sun;
  }

  if (displayFeaturePattern.test(normalizedLabel)) {
    return MonitorUp;
  }

  if (ventilationFeaturePattern.test(normalizedLabel)) {
    return AirVent;
  }

  return CheckCircle2;
};

export const ListingEquipment = ({
  listing,
  locale,
  variant = "default",
}: ListingEquipmentProps) => {
  const features = listing.features ?? [];
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const heading = isBg ? "Екстри" : "Extras";

  if (variant === "mobile") {
    if (features.length === 0) {
      return null;
    }

    return (
      <section
        aria-label={heading}
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-3"
        data-slot="listing-equipment"
      >
        <h2 className="mb-3 font-semibold text-card-title tracking-heading">
          {heading}
        </h2>
        <ul className="grid gap-2 min-[360px]:grid-cols-2">
          {features.map((feature) => (
            <li
              className="flex min-w-0 items-start gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 text-meta leading-5"
              key={`${feature.bg}-${feature.en}`}
            >
              <Check
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-zinc-500"
                strokeWidth={2}
              />
              <span className="min-w-0 break-words">
                {isBg ? feature.bg : feature.en}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      aria-label={heading}
      className="mb-5 scroll-mt-24 overflow-hidden rounded-xl border border-zinc-200 bg-white lg:border-0 lg:bg-control lg:px-5 lg:py-5"
      data-slot="listing-equipment"
    >
      <div className="px-4 py-3.5 lg:px-0 lg:py-0">
        <h2 className="font-semibold text-card-title tracking-heading lg:text-card-title-lg">
          {heading}
        </h2>
      </div>

      {features.length > 0 ? (
        <ul className="divide-y divide-zinc-100 border-zinc-100 border-t lg:mt-4 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-2 lg:divide-y-0 lg:border-t-0">
          {features.map((feature) => {
            const Icon = getFeatureIcon(`${feature.bg} ${feature.en}`);

            return (
              <li
                className="flex min-h-11 min-w-0 items-center gap-2.5 px-4 py-2.5 text-compact-control lg:min-h-0 lg:px-0 lg:py-1.5"
                key={`${feature.bg}-${feature.en}`}
              >
                <Icon
                  aria-hidden="true"
                  className="size-[18px] shrink-0 text-zinc-500"
                  strokeWidth={1.7}
                />
                <span className="min-w-0">
                  {isBg ? feature.bg : feature.en}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-zinc-100 border-t px-4 py-3 text-meta text-zinc-600 lg:mt-4 lg:border-0 lg:px-0 lg:py-0 lg:text-muted-foreground">
          {isBg
            ? "Няма посочени екстри за тази обява."
            : "No extras were supplied for this listing."}
        </p>
      )}
    </section>
  );
};
