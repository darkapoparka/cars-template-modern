import { vehicleMakes, vehicleModelsByMake } from "@repo/marketplace";

export type VehicleTaxonomyPickerKind = "make" | "model";

export const vehicleTaxonomyInputClassName =
  "h-11 rounded-lg border-transparent bg-secondary shadow-none";

export const vehicleTaxonomySelectClassName =
  "h-11 w-full rounded-lg border border-transparent bg-secondary px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const vehicleTaxonomyPickerCopy = {
  bg: {
    close: "Затвори",
    makeDescription: "Потърсете или изберете марка от списъка.",
    makeGroup: "Марки",
    makePlaceholder: "Търсете марка…",
    makeTitle: "Изберете марка",
    modelDescription: "Изберете модел или въведете друг.",
    modelGroup: "Модели",
    modelPlaceholder: "Търсете модел…",
    noMatch: "Няма съвпадение.",
    use: "Използвайте",
  },
  en: {
    close: "Close",
    makeDescription: "Search or choose a make from the list.",
    makeGroup: "Makes",
    makePlaceholder: "Search makes…",
    makeTitle: "Choose a make",
    modelDescription: "Choose a model or enter another one.",
    modelGroup: "Models",
    modelPlaceholder: "Search models…",
    noMatch: "No match found.",
    use: "Use",
  },
} as const;

export const getVehicleTaxonomyModels = (make: string) =>
  make ? (vehicleModelsByMake[make] ?? []) : [];

export const getVehicleTaxonomyOptions = (
  kind: VehicleTaxonomyPickerKind | null,
  make: string
) => (kind === "make" ? vehicleMakes : getVehicleTaxonomyModels(make));

export const canUseCustomVehicleTaxonomyValue = (
  query: string,
  options: readonly string[]
) => {
  const trimmedQuery = query.trim();
  return (
    trimmedQuery.length > 1 &&
    !options.some(
      (option) =>
        option.toLocaleLowerCase() === trimmedQuery.toLocaleLowerCase()
    )
  );
};

export const getRequiredVehicleTaxonomyField = (
  make: string,
  model: string
): VehicleTaxonomyPickerKind | null => {
  if (!make) {
    return "make";
  }
  return model ? null : "model";
};
