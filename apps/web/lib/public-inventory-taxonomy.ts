import {
  slugifyMakeModel,
  type VehicleTaxonomyMakeOption,
} from "@repo/marketplace";

/** Use real inventory pairs when a category has no maintained taxonomy yet. */
export function buildPublicInventoryTaxonomy(
  pairs: readonly { make: string; model: string }[]
): VehicleTaxonomyMakeOption[] {
  const makes = new Map<string, VehicleTaxonomyMakeOption>();
  for (const pair of pairs) {
    const slug = slugifyMakeModel(pair.make);
    const make = makes.get(slug) ?? { name: pair.make, slug, models: [] };
    const modelSlug = slugifyMakeModel(pair.model);
    if (!make.models.some((model) => model.slug === modelSlug)) {
      make.models.push({ name: pair.model, slug: modelSlug, derivatives: [] });
    }
    makes.set(slug, make);
  }
  return [...makes.values()].sort((a, b) => a.name.localeCompare(b.name));
}
