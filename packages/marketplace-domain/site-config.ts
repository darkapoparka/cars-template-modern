import { z } from "zod";

/** Public configuration is data, never arbitrary CSS, HTML, or tenant authority. */
export const publicAssetPathSchema = z
  .string()
  .max(256)
  .regex(/^\/(?!\/)[A-Za-z0-9/_.-]+$/, "Use a local public asset path")
  .refine(
    (value) => !value.split("/").includes(".."),
    "Asset paths cannot traverse directories"
  );
const httpsUrl = z
  .url()
  .max(2048)
  .refine((value) => new URL(value).protocol === "https:", "Use HTTPS");
const phoneHref = z
  .string()
  .regex(/^tel:\+[1-9]\d{6,14}$/, "Use an international tel: link");
export const brandColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hexadecimal color");
export const publicLocaleSchema = z.enum(["bg", "en"]);
export const publicVehicleCategorySchema = z.enum([
  "car",
  "truck",
  "van",
  "motorbike",
]);
export const publicServicesSchema = z.object({
  buy: z.boolean(),
  sell: z.boolean(),
  imports: z.boolean(),
  lease: z.boolean(),
  editorial: z.boolean(),
});
export type PublicService = keyof z.infer<typeof publicServicesSchema>;

export const publicArtworkSchema = z.object({
  heroScene: publicAssetPathSchema.optional(),
  heroLeft: publicAssetPathSchema,
  heroRight: publicAssetPathSchema,
  contactHero: publicAssetPathSchema,
  sellHero: publicAssetPathSchema,
  importHero: publicAssetPathSchema,
  financeHero: publicAssetPathSchema,
  financePromotion: publicAssetPathSchema,
  bodyTypes: z.record(z.string(), publicAssetPathSchema),
  brands: z.record(z.string(), publicAssetPathSchema),
});
export type PublicSiteArtwork = z.infer<typeof publicArtworkSchema>;

export const publicSiteSchema = z
  .object({
    kind: z.enum(["dealership", "marketplace"]),
    identity: z.object({
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string().trim().min(1).max(120),
      shortName: z.string().trim().min(1).max(60),
      tagline: z.string().trim().max(300),
      logo: publicAssetPathSchema,
      inverseLogo: publicAssetPathSchema,
      icon: publicAssetPathSchema,
    }),
    contact: z.object({
      address: z.string().trim().min(1).max(300),
      city: z.string().trim().min(1).max(120),
      phoneDisplay: z.string().trim().min(1).max(40),
      phoneHref,
      contactUrl: z.union([phoneHref, httpsUrl]),
      email: z.union([z.email(), z.literal("")]),
      mapsUrl: httpsUrl,
      mapsEmbedUrl: httpsUrl,
      socialLinks: z.object({
        youtube: httpsUrl.optional(),
        instagram: httpsUrl.optional(),
        facebook: httpsUrl.optional(),
        tiktok: httpsUrl.optional(),
      }),
    }),
    market: z.object({
      countryCode: z.string().regex(/^[A-Z]{2}$/),
      country: z.string().trim().min(1),
      currency: z.enum(["AED", "BGN", "EUR", "USD"]),
      formattingLocale: z
        .string()
        .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)
        .refine((locale) => {
          try {
            new Intl.NumberFormat(locale);
            return true;
          } catch {
            return false;
          }
        }, "Unsupported formatting locale"),
      defaultLocale: publicLocaleSchema,
      locales: z.array(publicLocaleSchema).min(1).max(2),
    }),
    services: publicServicesSchema,
    categories: z.array(publicVehicleCategorySchema).min(1).max(4),
    theme: z.object({
      accent: brandColorSchema,
      colorMode: z.literal("light"),
    }),
    artwork: publicArtworkSchema,
  })
  .superRefine((site, context) => {
    if (!site.market.locales.includes(site.market.defaultLocale)) {
      context.addIssue({
        code: "custom",
        path: ["market", "defaultLocale"],
        message: "The default locale must be enabled",
      });
    }
    if (new Set(site.market.locales).size !== site.market.locales.length) {
      context.addIssue({
        code: "custom",
        path: ["market", "locales"],
        message: "Locales must be unique",
      });
    }
    if (new Set(site.categories).size !== site.categories.length) {
      context.addIssue({
        code: "custom",
        path: ["categories"],
        message: "Categories must be unique",
      });
    }
  });
export type PublicSiteConfig = z.infer<typeof publicSiteSchema>;

const serviceRoutes: Readonly<Record<string, PublicService>> = {
  cars: "buy",
  trucks: "buy",
  vans: "buy",
  motorbikes: "buy",
  listing: "buy",
  sell: "sell",
  imports: "imports",
  lease: "lease",
  collections: "buy",
  blog: "editorial",
  guides: "editorial",
};
const categoryRoutes = {
  cars: "car",
  trucks: "truck",
  vans: "van",
  motorbikes: "motorbike",
} as const;

/** The same capability policy drives links, route guards, and discovery metadata. */
export const isPublicSitePathEnabled = (
  pathname: string,
  site: PublicSiteConfig
): boolean => {
  const segments = pathname.split("?")[0].split("/").filter(Boolean);
  const first = segments[0];
  const route = first === "bg" || first === "en" ? segments[1] : first;
  if (!route) {
    return site.services.buy;
  }
  const service = serviceRoutes[route];
  if (service && !site.services[service]) {
    return false;
  }
  const category = categoryRoutes[route as keyof typeof categoryRoutes];
  return !category || site.categories.includes(category);
};
