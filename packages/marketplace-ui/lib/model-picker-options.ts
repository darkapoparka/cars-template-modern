import type { VehicleTaxonomyModelOption } from "@repo/marketplace";

const popularModelSlugsByMake: Readonly<Record<string, readonly string[]>> = {
  BMW: ["1-series", "2-series", "3-series", "4-series", "5-series"],
};

export interface MarketplaceModelInventoryCount {
  count: number;
  make: string;
  model: string;
}

export interface MarketplaceModelPickerGroups {
  popular: VehicleTaxonomyModelOption[];
  remaining: VehicleTaxonomyModelOption[];
}

export const getMarketplaceModelInventoryKey = (make: string, model: string) =>
  `${make.trim().toLocaleLowerCase()}\u0000${model.trim().toLocaleLowerCase()}`;

export const getMarketplaceModelPickerGroups = ({
  make,
  models,
  prioritizePopular,
}: {
  make?: string;
  models: readonly VehicleTaxonomyModelOption[];
  prioritizePopular: boolean;
}): MarketplaceModelPickerGroups => {
  const popularSlugs = prioritizePopular
    ? popularModelSlugsByMake[make ?? ""]
    : undefined;

  if (!popularSlugs) {
    return { popular: [], remaining: [...models] };
  }

  const modelsBySlug = new Map(models.map((model) => [model.slug, model]));
  const popular = popularSlugs.flatMap((slug) => {
    const model = modelsBySlug.get(slug);
    return model ? [model] : [];
  });
  const popularSlugSet = new Set(popularSlugs);

  return {
    popular,
    remaining: models.filter((model) => !popularSlugSet.has(model.slug)),
  };
};
