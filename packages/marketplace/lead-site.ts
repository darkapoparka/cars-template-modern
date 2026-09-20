import type {
  PublicSiteArtwork,
  PublicSiteConfig,
} from "@repo/marketplace-domain/site-config";
import { inventoryCopy } from "./content/inventory-copy";

export type LeadSiteCurrency = "AED" | "BGN" | "EUR" | "USD";

export interface LeadSiteCopy {
  readonly address: string;
  readonly city: string;
  readonly country: string;
  readonly tagline: string;
}

export type DealerInventoryCopy = Readonly<
  Record<
    string,
    {
      readonly sourceDescription?: string;
      readonly bg: {
        readonly description: string;
        readonly imageAlts: readonly string[];
      };
      readonly en: {
        readonly description: string;
        readonly imageAlts: readonly string[];
      };
    }
  >
>;

export interface LeadSiteConfig {
  readonly accent: string;
  readonly address: string;
  readonly artwork?: Partial<PublicSiteArtwork>;
  readonly city: string;
  readonly colorMode?: "light";
  readonly contactUrl: string;
  readonly country: string;
  readonly countryCode: string;
  readonly currency: LeadSiteCurrency;
  readonly district: { readonly bg: string; readonly en: string };
  readonly email: string;
  readonly financingArtworkPath: string;
  readonly heroPath: string;
  readonly iconPath?: string;
  readonly inventoryCategories?: readonly (
    | "car"
    | "truck"
    | "van"
    | "motorbike"
  )[];
  readonly inventoryCopy?: DealerInventoryCopy;
  readonly locale: string;
  readonly localizedCopy?: Readonly<Record<"bg" | "en", LeadSiteCopy>>;
  readonly logoInversePath?: string;
  readonly logoPath: string;
  readonly mapsEmbedUrl: string;
  readonly mapsUrl: string;
  readonly name: string;
  readonly phoneDisplay: string;
  readonly phoneHref: string;
  readonly publicDefaultLocale?: "bg" | "en";
  readonly publicLocales?: readonly ("bg" | "en")[];
  readonly sellCategoryAssets: Readonly<
    Record<"car" | "motorbike" | "truck" | "van", string>
  >;
  readonly services?: Partial<PublicSiteConfig["services"]>;
  readonly shortName: string;
  readonly slug: string;
  readonly socialLinks?: Partial<
    Record<"youtube" | "instagram" | "facebook" | "tiktok", string>
  >;
  readonly staticDemoMode: boolean;
  readonly tagline: string;
  readonly websiteKind?: PublicSiteConfig["kind"];
}

// LEAD_SITE_CONFIG_START
export const leadSite: LeadSiteConfig = {
  websiteKind: "dealership",
  publicLocales: ["bg", "en"],
  publicDefaultLocale: "bg",
  inventoryCopy,
  localizedCopy: {
    bg: {
      address: "ул. „Атанас Манчев“ 18, Студентски град",
      city: "София",
      country: "България",
      tagline: "Премиум автомобили, внос и собствен лизинг в София.",
    },
    en: {
      address: "18 Atanas Manchev Street, Studentski grad",
      city: "Sofia",
      country: "Bulgaria",
      tagline: "Premium vehicles, imports and in-house leasing in Sofia.",
    },
  },
  accent: "#c40101",
  address: "ул. „Атанас Манчев“ 18, Студентски град",
  city: "София",
  district: { bg: "Студентски град", en: "Studentski grad" },
  sellCategoryAssets: {
    car: "/lead-sell-car-v1.png",
    motorbike: "/lead-sell-motorcycle-v1.png",
    truck: "/lead-sell-truck-v1.png",
    van: "/lead-sell-van-v1.png",
  },
  financingArtworkPath: "/images/services/leasing-red-suv-v2.webp",
  contactUrl: "tel:+359877733110",
  country: "България",
  countryCode: "BG",
  currency: "BGN",
  email: "",
  heroPath: "/lead-hero.jpg",
  locale: "bg-BG",
  logoPath: "/lead-logo.png",
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d7302.453092836291!2d23.3443286!3d42.649331!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1627293157601!5m2!1sen!2s",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=%D1%83%D0%BB.%20%D0%90%D1%82%D0%B0%D0%BD%D0%B0%D1%81%20%D0%9C%D0%B0%D0%BD%D1%87%D0%B5%D0%B2%2018%2C%20%D0%A1%D0%BE%D1%84%D0%B8%D1%8F%2C%20%D0%91%D1%8A%D0%BB%D0%B3%D0%B0%D1%80%D0%B8%D1%8F",
  name: "Day & Night Auto Group",
  phoneDisplay: "0877 733 110",
  phoneHref: "tel:+359877733110",
  shortName: "Day & Night",
  slug: "day-night-auto-group",
  socialLinks: {
    instagram: "https://www.instagram.com/dayandnight_autogroup/",
    youtube: "https://www.youtube.com/@kristiankirilov1355/",
    facebook: "https://www.facebook.com/deninoshtautogroup/",
  },
  staticDemoMode: true,
  tagline: "Премиум автомобили, внос и собствен лизинг в София.",
};
// LEAD_SITE_CONFIG_END
