import type { BodyType } from "@repo/marketplace";
import { publicSite } from "@repo/marketplace/site-config";

export type DesktopDiscoveryBodyType = Extract<
  BodyType,
  "suv" | "sedan" | "hatchback" | "coupe" | "convertible" | "wagon" | "van"
>;

export interface DesktopDiscoveryBodyTypeOption {
  artwork: string;
  bodyType: DesktopDiscoveryBodyType;
  imageClassName?: string;
}

export const desktopDiscoveryBodyTypes: readonly DesktopDiscoveryBodyTypeOption[] =
  [
    {
      artwork: publicSite.artwork.bodyTypes.suv,
      bodyType: "suv",
    },
    {
      artwork: publicSite.artwork.bodyTypes.sedan,
      bodyType: "sedan",
    },
    {
      artwork: publicSite.artwork.bodyTypes.hatchback,
      bodyType: "hatchback",
    },
    {
      artwork: publicSite.artwork.bodyTypes.coupe,
      bodyType: "coupe",
    },
    {
      artwork: publicSite.artwork.bodyTypes.convertible,
      bodyType: "convertible",
      imageClassName: "compactArtwork",
    },
    {
      artwork: publicSite.artwork.bodyTypes.wagon,
      bodyType: "wagon",
    },
    {
      artwork: publicSite.artwork.bodyTypes.van,
      bodyType: "van",
      imageClassName: "compactArtwork",
    },
  ];

export const getDesktopBrandArtwork = (make: string) =>
  publicSite.artwork.brands[make];
