import { Button } from "@repo/design-system/components/ui/button";
import { leadSite } from "@repo/marketplace";
import { ArrowUpRight } from "lucide-react";

interface ListingLocationProps {
  readonly locale?: string;
}

export const ListingLocation = ({ locale }: ListingLocationProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const mapEmbedUrl = leadSite.mapsEmbedUrl;

  return (
    <section
      aria-labelledby="listing-location-heading"
      className="relative isolate h-80 overflow-hidden rounded-xl"
      data-slot="listing-location"
      id="listing-location"
    >
      <iframe
        allowFullScreen
        className="block h-full w-full border-0"
        height={320}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={mapEmbedUrl}
        title={isBg ? "Карта на шоурума" : "Showroom map"}
        width="100%"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 [text-shadow:0_1px_2px_white,0_0_8px_white]">
            <h2 className="font-semibold text-lg" id="listing-location-heading">
              {leadSite.city}
            </h2>
            <p className="mt-1 font-medium text-sm">
              {leadSite.district[isBg ? "bg" : "en"]}
            </p>
            <p className="mt-0.5 text-sm text-zinc-950">
              {leadSite.address}, {leadSite.country}
            </p>
          </div>

          <Button
            aria-label={
              isBg
                ? "Отвори адреса в Google Maps"
                : "Open address in Google Maps"
            }
            asChild
            className="pointer-events-auto size-11 shrink-0 rounded-full bg-white/90 p-0 text-zinc-950 shadow-sm hover:bg-white"
            variant="secondary"
          >
            <a href={leadSite.mapsUrl} rel="noreferrer" target="_blank">
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
