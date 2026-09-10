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
      className="px-4 py-5 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-5"
      data-slot="listing-location"
      id="listing-location"
    >
      <div className="space-y-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-lg" id="listing-location-heading">
              {leadSite.city}
            </h2>
            <p className="mt-1 font-medium text-sm">
              {isBg ? "Студентски град" : "Studentski grad"}
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
            className="size-9 shrink-0 rounded-lg"
            size="icon"
            variant="secondary"
          >
            <a href={leadSite.mapsUrl} rel="noreferrer" target="_blank">
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </Button>
        </div>

        <div className="h-48 overflow-hidden rounded-2xl bg-control lg:rounded-xl">
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
