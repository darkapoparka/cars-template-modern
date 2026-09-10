import { z } from "zod";
import { bodyTypes, vehicleCategoryIds } from "./taxonomy";
import type {
  BodyType,
  FuelType,
  Transmission,
  VehicleCategory,
} from "./types";

export const vehicleTaxonomySourceKinds = [
  "government",
  "manufacturer",
  "commercial",
  "curated",
] as const;

export const vehicleTaxonomyEntityKinds = [
  "make",
  "model",
  "derivative",
  "generation",
  "trim",
  "powertrain",
] as const;

export const vehicleTaxonomySourceKindSchema = z.enum(
  vehicleTaxonomySourceKinds
);
export const vehicleTaxonomyEntityKindSchema = z.enum(
  vehicleTaxonomyEntityKinds
);

export type VehicleTaxonomySourceKind =
  (typeof vehicleTaxonomySourceKinds)[number];
export type VehicleTaxonomyEntityKind =
  (typeof vehicleTaxonomyEntityKinds)[number];

export interface VehicleTaxonomySourceDefinition {
  datasetVersion?: string;
  key: string;
  kind: VehicleTaxonomySourceKind;
  license?: string;
  marketCodes: string[];
  name: string;
  publishedAt?: string;
  url?: string;
}

export interface VehicleTaxonomySourceReferenceDefinition {
  externalId: string;
  label?: string;
  sourceKey: string;
}

export interface VehicleDerivativeDefinition {
  aliases?: string[];
  bodyType?: BodyType;
  fromYear?: number;
  name: string;
  slug?: string;
  sourceReferences?: VehicleTaxonomySourceReferenceDefinition[];
  toYear?: number;
}

export interface VehicleGenerationDefinition {
  aliases?: string[];
  code: string;
  fromYear?: number;
  name?: string;
  sourceReferences?: VehicleTaxonomySourceReferenceDefinition[];
  toYear?: number;
}

export interface VehicleTrimDefinition {
  derivativeSlug?: string;
  fromYear?: number;
  generationCode?: string;
  marketCodes?: string[];
  name: string;
  sourceReferences?: VehicleTaxonomySourceReferenceDefinition[];
  toYear?: number;
}

export interface VehiclePowertrainDefinition {
  derivativeSlug?: string;
  fromYear?: number;
  fuelType?: FuelType;
  generationCode?: string;
  marketCodes?: string[];
  name: string;
  sourceReferences?: VehicleTaxonomySourceReferenceDefinition[];
  toYear?: number;
  transmission?: Transmission;
}

export interface VehicleModelDefinition {
  aliases?: string[];
  category: VehicleCategory;
  derivatives?: VehicleDerivativeDefinition[];
  fromYear?: number;
  generations?: VehicleGenerationDefinition[];
  name: string;
  powertrains?: VehiclePowertrainDefinition[];
  slug?: string;
  sortOrder?: number;
  sourceReferences?: VehicleTaxonomySourceReferenceDefinition[];
  toYear?: number;
  trims?: VehicleTrimDefinition[];
}

export interface VehicleMakeDefinition {
  aliases?: string[];
  models: VehicleModelDefinition[];
  name: string;
  slug?: string;
  sortOrder?: number;
  sourceReferences?: VehicleTaxonomySourceReferenceDefinition[];
}

export interface VehicleTaxonomyCatalog {
  makes: VehicleMakeDefinition[];
  sources: VehicleTaxonomySourceDefinition[];
  version: string;
}

export interface VehicleTaxonomyDerivativeOption {
  bodyType?: BodyType;
  fromYear?: number;
  name: string;
  slug: string;
  toYear?: number;
}

export interface VehicleTaxonomyModelOption {
  derivatives: VehicleTaxonomyDerivativeOption[];
  fromYear?: number;
  name: string;
  slug: string;
  toYear?: number;
}

export interface VehicleTaxonomyMakeOption {
  models: VehicleTaxonomyModelOption[];
  name: string;
  slug: string;
}

const taxonomySlugInvalidPattern = /[^a-z0-9]+/g;
const taxonomySlugEdgePattern = /(^-|-$)/g;
const taxonomyWhitespacePattern = /\s+/g;

export const slugifyVehicleTaxonomyValue = (value: string) =>
  value
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replaceAll(taxonomySlugInvalidPattern, "-")
    .replaceAll(taxonomySlugEdgePattern, "");

export const normalizeVehicleTaxonomyLabel = (value: string) =>
  value
    .normalize("NFKC")
    .trim()
    .replaceAll(taxonomyWhitespacePattern, " ")
    .toLocaleLowerCase("en");

export const getVehicleMakeId = (makeSlug: string) =>
  `vehicle-make-${makeSlug}`;

export const getVehicleModelId = (makeSlug: string, modelSlug: string) =>
  `vehicle-model-${makeSlug}-${modelSlug}`;

export const getVehicleDerivativeId = (
  makeSlug: string,
  modelSlug: string,
  derivativeSlug: string
) => `vehicle-derivative-${makeSlug}-${modelSlug}-${derivativeSlug}`;

export const getVehicleGenerationId = (
  makeSlug: string,
  modelSlug: string,
  generationCode: string
) =>
  `vehicle-generation-${makeSlug}-${modelSlug}-${slugifyVehicleTaxonomyValue(
    generationCode
  )}`;

export const getVehicleTrimId = (
  makeSlug: string,
  modelSlug: string,
  trimName: string,
  marketCodes: readonly string[] = []
) =>
  `vehicle-trim-${makeSlug}-${modelSlug}-${slugifyVehicleTaxonomyValue(
    trimName
  )}-${marketCodes.join("-").toLowerCase() || "global"}`;

export const getVehiclePowertrainId = (
  makeSlug: string,
  modelSlug: string,
  powertrainName: string,
  marketCodes: readonly string[] = []
) =>
  `vehicle-powertrain-${makeSlug}-${modelSlug}-${slugifyVehicleTaxonomyValue(
    powertrainName
  )}-${marketCodes.join("-").toLowerCase() || "global"}`;

export const buildVehicleTaxonomyOptions = (
  catalog: VehicleTaxonomyCatalog,
  category: VehicleCategory
): VehicleTaxonomyMakeOption[] => {
  const taxonomyCategory = category === "lease" ? "car" : category;

  return catalog.makes
    .map((make) => {
      const makeSlug = make.slug ?? slugifyVehicleTaxonomyValue(make.name);
      const models = make.models
        .filter((model) => model.category === taxonomyCategory)
        .sort(
          (left, right) =>
            (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
              (right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
            left.name.localeCompare(right.name)
        )
        .map((model) => ({
          derivatives: (model.derivatives ?? []).map((derivative) => ({
            ...(derivative.bodyType ? { bodyType: derivative.bodyType } : {}),
            ...(derivative.fromYear ? { fromYear: derivative.fromYear } : {}),
            name: derivative.name,
            slug:
              derivative.slug ?? slugifyVehicleTaxonomyValue(derivative.name),
            ...(derivative.toYear ? { toYear: derivative.toYear } : {}),
          })),
          ...(model.fromYear ? { fromYear: model.fromYear } : {}),
          name: model.name,
          slug: model.slug ?? slugifyVehicleTaxonomyValue(model.name),
          ...(model.toYear ? { toYear: model.toYear } : {}),
        }));

      return {
        models,
        name: make.name,
        slug: makeSlug,
        sortOrder: make.sortOrder,
      };
    })
    .filter((make) => make.models.length > 0)
    .sort(
      (left, right) =>
        (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.name.localeCompare(right.name)
    )
    .map(({ models, name, slug }) => ({ models, name, slug }));
};

export const vehicleTaxonomySourceDefinitionSchema = z
  .object({
    datasetVersion: z.string().trim().min(1).max(120).optional(),
    key: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]*$/),
    kind: vehicleTaxonomySourceKindSchema,
    license: z.string().trim().min(1).max(240).optional(),
    marketCodes: z.array(z.string().trim().toUpperCase().length(2)),
    name: z.string().trim().min(1).max(160),
    publishedAt: z.iso.datetime().optional(),
    url: z.url().optional(),
  })
  .strict();

export const vehicleTaxonomyDerivativeOptionSchema = z
  .object({
    bodyType: z.enum(bodyTypes).optional(),
    fromYear: z.number().int().min(1886).max(2100).optional(),
    name: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]*$/),
    toYear: z.number().int().min(1886).max(2100).optional(),
  })
  .strict();

export const vehicleTaxonomyModelOptionSchema = z
  .object({
    derivatives: z.array(vehicleTaxonomyDerivativeOptionSchema),
    fromYear: z.number().int().min(1886).max(2100).optional(),
    name: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]*$/),
    toYear: z.number().int().min(1886).max(2100).optional(),
  })
  .strict();

export const vehicleTaxonomyMakeOptionSchema = z
  .object({
    models: z.array(vehicleTaxonomyModelOptionSchema),
    name: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9-]*$/),
  })
  .strict();

export const vehicleTaxonomyOptionsSchema = z.array(
  vehicleTaxonomyMakeOptionSchema
);

export const vehicleTaxonomyCategorySchema = z.enum(vehicleCategoryIds);
