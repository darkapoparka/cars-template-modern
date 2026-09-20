import { leadSite } from "@repo/marketplace";
import { getLeadCopy } from "@repo/marketplace/lead-copy";

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
      <h2 className="sr-only" id="listing-location-heading">
        {getLeadCopy(locale).city}, {getLeadCopy(locale).address}
      </h2>
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
    </section>
  );
};
