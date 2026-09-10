import {
  getVehicleDerivativeId,
  getVehicleGenerationId,
  getVehicleMakeId,
  getVehicleModelId,
  getVehiclePowertrainId,
  getVehicleTrimId,
  normalizeVehicleTaxonomyLabel,
  slugifyVehicleTaxonomyValue,
  type VehicleCategory,
  type VehicleTaxonomyCatalog,
  type VehicleTaxonomyEntityKind,
  type VehicleTaxonomyMakeOption,
} from "@repo/marketplace-domain";
import type {
  Prisma,
  PrismaClient,
  VehicleTaxonomySource,
} from "./generated/client";

const CURATED_SOURCE_KEY = "automarket-curated-eu";

const getTaxonomySourceId = (key: string) => `taxonomy-source-${key}`;

const normalizeAliases = (aliases: readonly string[] | undefined) =>
  (aliases ?? []).map(normalizeVehicleTaxonomyLabel);

const toDate = (value: string | undefined) =>
  value ? new Date(value) : undefined;

type TaxonomyReferenceTarget =
  | { entityKind: "make"; makeId: string }
  | { entityKind: "model"; modelId: string }
  | { derivativeId: string; entityKind: "derivative" }
  | { entityKind: "generation"; generationId: string }
  | { entityKind: "trim"; trimId: string }
  | { entityKind: "powertrain"; powertrainId: string };

const upsertSourceReference = async (
  client: PrismaClient,
  sourcesByKey: ReadonlyMap<string, VehicleTaxonomySource>,
  target: TaxonomyReferenceTarget,
  reference: {
    externalId: string;
    label?: string;
    sourceKey: string;
  }
) => {
  const source = sourcesByKey.get(reference.sourceKey);
  if (!source) {
    throw new Error(
      `Unknown vehicle taxonomy source "${reference.sourceKey}".`
    );
  }

  await client.vehicleTaxonomyReference.upsert({
    create: {
      ...target,
      externalId: reference.externalId,
      label: reference.label,
      sourceId: source.id,
      sourceVersion: source.datasetVersion,
    },
    update: {
      ...target,
      label: reference.label,
      sourceVersion: source.datasetVersion,
    },
    where: {
      sourceId_entityKind_externalId: {
        entityKind: target.entityKind,
        externalId: reference.externalId,
        sourceId: source.id,
      },
    },
  });
};

const upsertEntityReferences = async (
  client: PrismaClient,
  sourcesByKey: ReadonlyMap<string, VehicleTaxonomySource>,
  target: TaxonomyReferenceTarget,
  canonicalExternalId: string,
  references: readonly {
    externalId: string;
    label?: string;
    sourceKey: string;
  }[]
) => {
  await upsertSourceReference(client, sourcesByKey, target, {
    externalId: canonicalExternalId,
    sourceKey: CURATED_SOURCE_KEY,
  });

  for (const reference of references) {
    await upsertSourceReference(client, sourcesByKey, target, reference);
  }
};

export interface SeedVehicleTaxonomyResult {
  derivatives: number;
  generations: number;
  makes: number;
  models: number;
  powertrains: number;
  sources: number;
  trims: number;
}

export const seedVehicleTaxonomyCatalog = async (
  client: PrismaClient,
  catalog: VehicleTaxonomyCatalog
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Keeping the ordered, idempotent taxonomy upserts in one auditable seed routine makes source-to-entity relationships explicit.
): Promise<SeedVehicleTaxonomyResult> => {
  const sourcesByKey = new Map<string, VehicleTaxonomySource>();

  for (const source of catalog.sources) {
    const row = await client.vehicleTaxonomySource.upsert({
      create: {
        datasetVersion: source.datasetVersion,
        id: getTaxonomySourceId(source.key),
        key: source.key,
        kind: source.kind,
        license: source.license,
        marketCodes: source.marketCodes,
        name: source.name,
        publishedAt: toDate(source.publishedAt),
        retrievedAt: new Date(),
        url: source.url,
      },
      update: {
        datasetVersion: source.datasetVersion,
        isActive: true,
        kind: source.kind,
        license: source.license,
        marketCodes: source.marketCodes,
        name: source.name,
        publishedAt: toDate(source.publishedAt),
        retrievedAt: new Date(),
        url: source.url,
      },
      where: { key: source.key },
    });
    sourcesByKey.set(source.key, row);
  }

  const counts: SeedVehicleTaxonomyResult = {
    derivatives: 0,
    generations: 0,
    makes: 0,
    models: 0,
    powertrains: 0,
    sources: sourcesByKey.size,
    trims: 0,
  };

  for (const makeDefinition of catalog.makes) {
    const makeSlug =
      makeDefinition.slug ?? slugifyVehicleTaxonomyValue(makeDefinition.name);
    const makeId = getVehicleMakeId(makeSlug);

    await client.vehicleMake.upsert({
      create: {
        aliases: normalizeAliases(makeDefinition.aliases),
        id: makeId,
        name: makeDefinition.name,
        normalizedName: normalizeVehicleTaxonomyLabel(makeDefinition.name),
        slug: makeSlug,
        sortOrder: makeDefinition.sortOrder ?? 0,
      },
      update: {
        aliases: normalizeAliases(makeDefinition.aliases),
        isActive: true,
        name: makeDefinition.name,
        normalizedName: normalizeVehicleTaxonomyLabel(makeDefinition.name),
        sortOrder: makeDefinition.sortOrder ?? 0,
      },
      where: { id: makeId },
    });
    counts.makes += 1;

    await upsertEntityReferences(
      client,
      sourcesByKey,
      { entityKind: "make", makeId },
      makeId,
      makeDefinition.sourceReferences ?? []
    );

    for (const modelDefinition of makeDefinition.models) {
      const modelSlug =
        modelDefinition.slug ??
        slugifyVehicleTaxonomyValue(modelDefinition.name);
      const modelId = getVehicleModelId(makeSlug, modelSlug);

      await client.vehicleModelFamily.upsert({
        create: {
          aliases: normalizeAliases(modelDefinition.aliases),
          category: modelDefinition.category,
          fromYear: modelDefinition.fromYear,
          id: modelId,
          makeId,
          name: modelDefinition.name,
          normalizedName: normalizeVehicleTaxonomyLabel(modelDefinition.name),
          slug: modelSlug,
          sortOrder: modelDefinition.sortOrder ?? 0,
          toYear: modelDefinition.toYear,
        },
        update: {
          aliases: normalizeAliases(modelDefinition.aliases),
          fromYear: modelDefinition.fromYear,
          isActive: true,
          name: modelDefinition.name,
          normalizedName: normalizeVehicleTaxonomyLabel(modelDefinition.name),
          sortOrder: modelDefinition.sortOrder ?? 0,
          toYear: modelDefinition.toYear,
        },
        where: { id: modelId },
      });
      counts.models += 1;

      await upsertEntityReferences(
        client,
        sourcesByKey,
        { entityKind: "model", modelId },
        modelId,
        modelDefinition.sourceReferences ?? []
      );

      const derivativeIdsBySlug = new Map<string, string>();
      for (const [derivativeIndex, derivativeDefinition] of (
        modelDefinition.derivatives ?? []
      ).entries()) {
        const derivativeSlug =
          derivativeDefinition.slug ??
          slugifyVehicleTaxonomyValue(derivativeDefinition.name);
        const derivativeId = getVehicleDerivativeId(
          makeSlug,
          modelSlug,
          derivativeSlug
        );
        derivativeIdsBySlug.set(derivativeSlug, derivativeId);

        await client.vehicleDerivative.upsert({
          create: {
            aliases: normalizeAliases(derivativeDefinition.aliases),
            bodyType: derivativeDefinition.bodyType,
            fromYear: derivativeDefinition.fromYear,
            id: derivativeId,
            modelId,
            name: derivativeDefinition.name,
            normalizedName: normalizeVehicleTaxonomyLabel(
              derivativeDefinition.name
            ),
            slug: derivativeSlug,
            sortOrder: derivativeIndex,
            toYear: derivativeDefinition.toYear,
          },
          update: {
            aliases: normalizeAliases(derivativeDefinition.aliases),
            bodyType: derivativeDefinition.bodyType,
            fromYear: derivativeDefinition.fromYear,
            isActive: true,
            name: derivativeDefinition.name,
            normalizedName: normalizeVehicleTaxonomyLabel(
              derivativeDefinition.name
            ),
            sortOrder: derivativeIndex,
            toYear: derivativeDefinition.toYear,
          },
          where: { id: derivativeId },
        });
        counts.derivatives += 1;

        await upsertEntityReferences(
          client,
          sourcesByKey,
          { derivativeId, entityKind: "derivative" },
          derivativeId,
          derivativeDefinition.sourceReferences ?? []
        );
      }

      const generationIdsByCode = new Map<string, string>();
      for (const [generationIndex, generationDefinition] of (
        modelDefinition.generations ?? []
      ).entries()) {
        const generationId = getVehicleGenerationId(
          makeSlug,
          modelSlug,
          generationDefinition.code
        );
        generationIdsByCode.set(
          normalizeVehicleTaxonomyLabel(generationDefinition.code),
          generationId
        );

        await client.vehicleGeneration.upsert({
          create: {
            aliases: normalizeAliases(generationDefinition.aliases),
            code: generationDefinition.code,
            fromYear: generationDefinition.fromYear,
            id: generationId,
            modelId,
            name: generationDefinition.name,
            normalizedCode: normalizeVehicleTaxonomyLabel(
              generationDefinition.code
            ),
            sortOrder: generationIndex,
            toYear: generationDefinition.toYear,
          },
          update: {
            aliases: normalizeAliases(generationDefinition.aliases),
            code: generationDefinition.code,
            fromYear: generationDefinition.fromYear,
            isActive: true,
            name: generationDefinition.name,
            normalizedCode: normalizeVehicleTaxonomyLabel(
              generationDefinition.code
            ),
            sortOrder: generationIndex,
            toYear: generationDefinition.toYear,
          },
          where: { id: generationId },
        });
        counts.generations += 1;

        await upsertEntityReferences(
          client,
          sourcesByKey,
          { entityKind: "generation", generationId },
          generationId,
          generationDefinition.sourceReferences ?? []
        );
      }

      for (const trimDefinition of modelDefinition.trims ?? []) {
        const marketCodes = trimDefinition.marketCodes ?? [];
        const trimId = getVehicleTrimId(
          makeSlug,
          modelSlug,
          trimDefinition.name,
          marketCodes
        );
        const derivativeId = trimDefinition.derivativeSlug
          ? derivativeIdsBySlug.get(trimDefinition.derivativeSlug)
          : undefined;
        const generationId = trimDefinition.generationCode
          ? generationIdsByCode.get(
              normalizeVehicleTaxonomyLabel(trimDefinition.generationCode)
            )
          : undefined;

        await client.vehicleTrim.upsert({
          create: {
            derivativeId,
            fromYear: trimDefinition.fromYear,
            generationId,
            id: trimId,
            marketCodes,
            modelId,
            name: trimDefinition.name,
            normalizedName: normalizeVehicleTaxonomyLabel(trimDefinition.name),
            toYear: trimDefinition.toYear,
          },
          update: {
            derivativeId,
            fromYear: trimDefinition.fromYear,
            generationId,
            isActive: true,
            marketCodes,
            name: trimDefinition.name,
            normalizedName: normalizeVehicleTaxonomyLabel(trimDefinition.name),
            toYear: trimDefinition.toYear,
          },
          where: { id: trimId },
        });
        counts.trims += 1;

        await upsertEntityReferences(
          client,
          sourcesByKey,
          { entityKind: "trim", trimId },
          trimId,
          trimDefinition.sourceReferences ?? []
        );
      }

      for (const powertrainDefinition of modelDefinition.powertrains ?? []) {
        const marketCodes = powertrainDefinition.marketCodes ?? [];
        const powertrainId = getVehiclePowertrainId(
          makeSlug,
          modelSlug,
          powertrainDefinition.name,
          marketCodes
        );
        const derivativeId = powertrainDefinition.derivativeSlug
          ? derivativeIdsBySlug.get(powertrainDefinition.derivativeSlug)
          : undefined;
        const generationId = powertrainDefinition.generationCode
          ? generationIdsByCode.get(
              normalizeVehicleTaxonomyLabel(powertrainDefinition.generationCode)
            )
          : undefined;

        await client.vehiclePowertrain.upsert({
          create: {
            derivativeId,
            fromYear: powertrainDefinition.fromYear,
            fuelType: powertrainDefinition.fuelType,
            generationId,
            id: powertrainId,
            marketCodes,
            modelId,
            name: powertrainDefinition.name,
            normalizedName: normalizeVehicleTaxonomyLabel(
              powertrainDefinition.name
            ),
            toYear: powertrainDefinition.toYear,
            transmission: powertrainDefinition.transmission,
          },
          update: {
            derivativeId,
            fromYear: powertrainDefinition.fromYear,
            fuelType: powertrainDefinition.fuelType,
            generationId,
            isActive: true,
            marketCodes,
            name: powertrainDefinition.name,
            normalizedName: normalizeVehicleTaxonomyLabel(
              powertrainDefinition.name
            ),
            toYear: powertrainDefinition.toYear,
            transmission: powertrainDefinition.transmission,
          },
          where: { id: powertrainId },
        });
        counts.powertrains += 1;

        await upsertEntityReferences(
          client,
          sourcesByKey,
          { entityKind: "powertrain", powertrainId },
          powertrainId,
          powertrainDefinition.sourceReferences ?? []
        );
      }
    }
  }

  return counts;
};

export const getVehicleTaxonomyOptions = async (
  category: VehicleCategory = "car"
): Promise<VehicleTaxonomyMakeOption[]> => {
  const { database } = await import("./index");
  const taxonomyCategory = category === "lease" ? "car" : category;
  const makes = await database.vehicleMake.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      models: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          derivatives: {
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
              bodyType: true,
              fromYear: true,
              name: true,
              slug: true,
              toYear: true,
            },
            where: { isActive: true },
          },
          fromYear: true,
          name: true,
          slug: true,
          toYear: true,
        },
        where: {
          category: taxonomyCategory,
          isActive: true,
        },
      },
      name: true,
      slug: true,
    },
    where: {
      isActive: true,
      models: {
        some: {
          category: taxonomyCategory,
          isActive: true,
        },
      },
    },
  });

  return makes.map((makeRow) => ({
    models: makeRow.models.map((modelRow) => ({
      derivatives: modelRow.derivatives.map((derivativeRow) => ({
        ...(derivativeRow.bodyType ? { bodyType: derivativeRow.bodyType } : {}),
        ...(derivativeRow.fromYear ? { fromYear: derivativeRow.fromYear } : {}),
        name: derivativeRow.name,
        slug: derivativeRow.slug,
        ...(derivativeRow.toYear ? { toYear: derivativeRow.toYear } : {}),
      })),
      ...(modelRow.fromYear ? { fromYear: modelRow.fromYear } : {}),
      name: modelRow.name,
      slug: modelRow.slug,
      ...(modelRow.toYear ? { toYear: modelRow.toYear } : {}),
    })),
    name: makeRow.name,
    slug: makeRow.slug,
  }));
};

export interface VehicleTaxonomyResolutionInput {
  category: VehicleCategory;
  derivative?: string;
  make: string;
  model: string;
  year?: number;
}

export interface VehicleTaxonomyResolution {
  derivative?: {
    bodyType?: string;
    id: string;
    name: string;
  };
  make: { id: string; name: string };
  model: { id: string; name: string };
}

const canonicalOrAliasWhere = (
  value: string
): Pick<Prisma.VehicleMakeWhereInput, "OR"> => {
  const normalized = normalizeVehicleTaxonomyLabel(value);
  return {
    OR: [{ normalizedName: normalized }, { aliases: { has: normalized } }],
  };
};

export const resolveVehicleTaxonomy = async ({
  category,
  derivative,
  make,
  model,
  year,
}: VehicleTaxonomyResolutionInput): Promise<VehicleTaxonomyResolution | null> => {
  const { database } = await import("./index");
  const taxonomyCategory = category === "lease" ? "car" : category;
  const makeRow = await database.vehicleMake.findFirst({
    select: { id: true, name: true },
    where: {
      ...canonicalOrAliasWhere(make),
      isActive: true,
    },
  });

  if (!makeRow) {
    return null;
  }

  const normalizedModel = normalizeVehicleTaxonomyLabel(model);
  const modelRow = await database.vehicleModelFamily.findFirst({
    select: { id: true, name: true },
    where: {
      category: taxonomyCategory,
      isActive: true,
      makeId: makeRow.id,
      OR: [
        { normalizedName: normalizedModel },
        { aliases: { has: normalizedModel } },
      ],
      ...(year
        ? {
            AND: [
              { OR: [{ fromYear: null }, { fromYear: { lte: year } }] },
              { OR: [{ toYear: null }, { toYear: { gte: year } }] },
            ],
          }
        : {}),
    },
  });

  if (!modelRow) {
    return null;
  }

  if (!derivative) {
    return { make: makeRow, model: modelRow };
  }

  const normalizedDerivative = normalizeVehicleTaxonomyLabel(derivative);
  const derivativeRow = await database.vehicleDerivative.findFirst({
    select: { bodyType: true, id: true, name: true },
    where: {
      isActive: true,
      modelId: modelRow.id,
      OR: [
        { normalizedName: normalizedDerivative },
        { aliases: { has: normalizedDerivative } },
      ],
      ...(year
        ? {
            AND: [
              { OR: [{ fromYear: null }, { fromYear: { lte: year } }] },
              { OR: [{ toYear: null }, { toYear: { gte: year } }] },
            ],
          }
        : {}),
    },
  });

  return {
    ...(derivativeRow
      ? {
          derivative: {
            ...(derivativeRow.bodyType
              ? { bodyType: derivativeRow.bodyType }
              : {}),
            id: derivativeRow.id,
            name: derivativeRow.name,
          },
        }
      : {}),
    make: makeRow,
    model: modelRow,
  };
};

export const getVehicleTaxonomyEntityKind = (
  target: TaxonomyReferenceTarget
): VehicleTaxonomyEntityKind => target.entityKind;
