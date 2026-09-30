import { leadSite } from "@repo/marketplace";
import { getLeadCopy } from "@repo/marketplace/lead-copy";
import { publicSite } from "@repo/marketplace/site-config";
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
      className="overflow-hidden rounded-xl bg-secondary"
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
        artwork={publicSite.artwork.contactHero}
        external
        heading={isBg ? "Посетете шоурума" : "Visit the showroom"}
        headingId="listing-location-heading"
        href={leadSite.mapsUrl}
        slot="listing-showroom-card"
      >
        <p className="max-w-64 text-meta text-white/90">
          {copy.address}, {copy.city}
        </p>
      </ListingCtaBanner>
      <details className="group">
        <summary className="cursor-pointer px-4 py-3 font-medium text-meta focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]">
          {isBg ? "Карта на шоурума" : "Showroom map"}
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
