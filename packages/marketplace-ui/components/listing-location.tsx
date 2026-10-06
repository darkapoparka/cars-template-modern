import { leadSite } from "@repo/marketplace";
import { getLeadCopy } from "@repo/marketplace/lead-copy";
import { publicSite } from "@repo/marketplace/site-config";
import { ChevronDown } from "lucide-react";
import { ListingCtaBanner } from "./listing-cta-banner";

interface ListingLocationProps {
  readonly locale?: string;
}

export const ListingLocation = ({ locale }: ListingLocationProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const mapEmbedUrl = leadSite.mapsEmbedUrl;
  const copy = getLeadCopy(locale);

  return (
    <section
      aria-labelledby="listing-location-heading"
      className="overflow-hidden rounded-2xl bg-zinc-950 text-white"
      data-slot="listing-location"
      id="listing-location"
    >
      <ListingCtaBanner
        action={
          <>
            {isBg ? "Упътвания" : "Get directions"}
            <span className="sr-only">
              {isBg ? " — отваря се в нов раздел" : " — opens in a new tab"}
            </span>
          </>
        }
        artwork={
          leadSite.mobileShowroomArtworkPath ?? publicSite.artwork.contactHero
        }
        external
        heading={isBg ? "Посетете шоурума" : "Visit the showroom"}
        headingId="listing-location-heading"
        href={leadSite.mapsUrl}
        layout="photo"
        slot="listing-showroom-card"
      >
        <p className="text-meta text-white/85 leading-5">
          {copy.address}, {copy.city}
        </p>
      </ListingCtaBanner>
      <details className="group border-white/15 border-t">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-3 font-medium text-meta text-white/85 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[-4px] [&::-webkit-details-marker]:hidden">
          {isBg ? "Карта на шоурума" : "Showroom map"}
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <iframe
          allowFullScreen
          className="block h-80 w-full border-0"
          height={320}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={mapEmbedUrl}
          title={isBg ? "Карта на шоурума" : "Showroom map"}
          width="100%"
        />
      </details>
    </section>
  );
};
