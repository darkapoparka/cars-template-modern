import {
  buildMarketplaceSearchHref,
  deslugMakeModel,
  getMakePath,
  getModelPath,
  parseMarketplaceSearchParams,
} from "@repo/marketplace";
import { log } from "@repo/observability/log";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { notFound, redirect } from "next/navigation";
import {
  getPublicMakeModelTaxonomy,
  normalizePublicShowroomFilters,
} from "@/lib/public-marketplace-data";
import { CategoryMarketplacePage } from "./category-marketplace-page";
import { InventoryUnavailable } from "./inventory-states";
import { PublicMarketplaceFrame } from "./public-marketplace-frame";

interface MakeModelMarketplacePageProps {
  locale: string;
  makeSlug: string;
  modelSlug?: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export interface ResolvedMakeModel {
  make: string;
  model?: string;
  path: string;
}

export const resolveMakeModelRoute = async (
  makeSlug: string,
  modelSlug?: string
): Promise<ResolvedMakeModel | null> => {
  const taxonomy = await getPublicMakeModelTaxonomy("car");
  const makes = Array.from(new Set(taxonomy.map((pair) => pair.make)));
  const make = deslugMakeModel(makeSlug.toLowerCase(), makes);

  if (!make) {
    return null;
  }

  if (!modelSlug) {
    return { make, path: getMakePath(make) };
  }

  const models = taxonomy
    .filter((pair) => pair.make === make)
    .map((pair) => pair.model);
  const model = deslugMakeModel(modelSlug.toLowerCase(), models);

  return model ? { make, model, path: getModelPath(make, model) } : null;
};

export const MakeModelMarketplacePage = async ({
  locale,
  makeSlug,
  modelSlug,
  searchParams,
}: MakeModelMarketplacePageProps) => {
  let resolved: ResolvedMakeModel | null;

  try {
    resolved = await resolveMakeModelRoute(makeSlug, modelSlug);
  } catch (error) {
    log.error("Make/model route taxonomy is unavailable.", { error });
    return (
      <PublicMarketplaceFrame activeMode="buy" locale={locale}>
        <InventoryUnavailable locale={locale} />
      </PublicMarketplaceFrame>
    );
  }

  if (!resolved) {
    notFound();
  }

  const requestedPath = modelSlug
    ? `/cars/${makeSlug}/${modelSlug}`
    : `/cars/${makeSlug}`;
  if (requestedPath !== resolved.path) {
    redirect(
      buildMarketplaceSearchHref(
        normalizePublicShowroomFilters(
          parseMarketplaceSearchParams(searchParams)
        ),
        getLocalizedPath(normalizeSeoLocale(locale), resolved.path)
      )
    );
  }

  return (
    <CategoryMarketplacePage
      category="car"
      locale={locale}
      make={resolved.make}
      model={resolved.model}
      routePath={resolved.path}
      searchParams={searchParams}
    />
  );
};
