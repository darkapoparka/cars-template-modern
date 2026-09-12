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
      className="mx-4 my-5 overflow-hidden rounded-2xl bg-zinc-100 py-5 lg:mx-0 lg:my-0 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:py-0"
      data-slot="listing-location"
      id="listing-location"
    >
      <div>
        <div className="flex min-w-0 items-start justify-between gap-4 px-4 lg:p-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-lg" id="listing-location-heading">
              {leadSite.city}
            </h2>
            <p className="mt-1 font-medium text-sm">
              {leadSite.district[isBg ? "bg" : "en"]}
            </p>
            <p className="mt-0.5 text-muted-foreground text-sm">
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
            className="h-11 shrink-0 gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 font-semibold text-[13px] shadow-none hover:bg-zinc-50 lg:h-9 lg:rounded-lg"
            variant="secondary"
          >
            <a href={leadSite.mapsUrl} rel="noreferrer" target="_blank">
              {isBg ? "Виж в Maps" : "View in Maps"}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </Button>
        </div>

        <div className="mx-4 mt-4 h-52 overflow-hidden rounded-xl bg-control lg:mx-0 lg:mt-0 lg:h-48 lg:rounded-none lg:border-border lg:border-t">
          <iframe
            className="block h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapEmbedUrl}
            title={isBg ? "Карта на шоурума" : "Showroom map"}
          />
        </div>
      </div>
    </section>
  );
};
