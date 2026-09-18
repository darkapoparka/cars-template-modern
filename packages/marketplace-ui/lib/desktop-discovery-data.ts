import type { BodyType } from "@repo/marketplace";

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
      artwork: "/marketplace/discovery/body-suv.webp",
      bodyType: "suv",
    },
    {
      artwork: "/marketplace/discovery/body-sedan.webp",
      bodyType: "sedan",
    },
    {
      artwork: "/marketplace/discovery/body-hatchback.webp",
      bodyType: "hatchback",
    },
    {
      artwork: "/marketplace/discovery/body-coupe.webp",
      bodyType: "coupe",
    },
    {
      artwork: "/marketplace/discovery/body-convertible.webp",
      bodyType: "convertible",
      imageClassName: "compactArtwork",
    },
    {
      artwork: "/marketplace/discovery/body-wagon.webp",
      bodyType: "wagon",
    },
    {
      artwork: "/marketplace/discovery/body-van.webp",
      bodyType: "van",
      imageClassName: "compactArtwork",
    },
  ];

const desktopBrandArtwork: Readonly<Record<string, string>> = {
  Audi: "/marketplace/discovery/brand-audi.svg",
  BMW: "/marketplace/discovery/brand-bmw.png",
  "Land Rover": "/marketplace/discovery/brand-land-rover.png",
  "Mercedes-Benz": "/marketplace/discovery/brand-mercedes.webp",
};

export const getDesktopBrandArtwork = (make: string) =>
  desktopBrandArtwork[make];
