import { describe, expect, it } from "vitest";
import { curatedVehicleTaxonomy } from "./vehicle-catalog";
import {
  buildVehicleTaxonomyOptions,
  slugifyVehicleTaxonomyValue,
} from "./vehicle-taxonomy";

describe("curated vehicle taxonomy", () => {
  it("provides a substantial, unique European make and model catalog", () => {
    const makeSlugs = curatedVehicleTaxonomy.makes.map(
      (make) => make.slug ?? slugifyVehicleTaxonomyValue(make.name)
    );
    const modelCount = curatedVehicleTaxonomy.makes.reduce(
      (total, make) => total + make.models.length,
      0
    );

    expect(new Set(makeSlugs).size).toBe(makeSlugs.length);
    expect(makeSlugs.length).toBeGreaterThanOrEqual(35);
    expect(modelCount).toBeGreaterThanOrEqual(400);

    for (const make of curatedVehicleTaxonomy.makes) {
      const modelKeys = make.models.map(
        (model) =>
          `${model.category}:${
            model.slug ?? slugifyVehicleTaxonomyValue(model.name)
          }`
      );
      expect(new Set(modelKeys).size).toBe(modelKeys.length);
    }
  });

  it("only references declared provenance sources", () => {
    const sourceKeys = new Set<string>(
      curatedVehicleTaxonomy.sources.map((source) => source.key)
    );
    const allReferences = curatedVehicleTaxonomy.makes.flatMap((make) => [
      ...(make.sourceReferences ?? []),
      ...make.models.flatMap((model) => [
        ...(model.sourceReferences ?? []),
        ...(model.derivatives ?? []).flatMap(
          (derivative) => derivative.sourceReferences ?? []
        ),
        ...(model.generations ?? []).flatMap(
          (generation) => generation.sourceReferences ?? []
        ),
        ...(model.trims ?? []).flatMap((trim) => trim.sourceReferences ?? []),
        ...(model.powertrains ?? []).flatMap(
          (powertrain) => powertrain.sourceReferences ?? []
        ),
      ]),
    ]);

    expect(allReferences.length).toBeGreaterThan(400);
    for (const reference of allReferences) {
      expect(sourceKeys.has(reference.sourceKey)).toBe(true);
    }
  });

  it("models Audi A3 derivatives instead of generic universal trims", () => {
    const audi = curatedVehicleTaxonomy.makes.find(
      (make) => make.name === "Audi"
    );
    const a3 = audi?.models.find((model) => model.name === "A3");

    expect(a3?.derivatives?.map((derivative) => derivative.name)).toEqual([
      "Sportback",
      "Limousine",
      "allstreet",
      "Cabriolet",
    ]);
    expect(a3?.generations?.map((generation) => generation.code)).toEqual([
      "8L",
      "8P",
      "8V",
      "8Y",
    ]);
    expect(a3?.trims?.map((trim) => trim.name)).toEqual(["Advanced", "S line"]);
  });

  it("uses the passenger-car catalog for lease discovery", () => {
    const carOptions = buildVehicleTaxonomyOptions(
      curatedVehicleTaxonomy,
      "car"
    );
    const leaseOptions = buildVehicleTaxonomyOptions(
      curatedVehicleTaxonomy,
      "lease"
    );

    expect(leaseOptions).toEqual(carOptions);
    expect(
      carOptions
        .find((make) => make.name === "Audi")
        ?.models.find((model) => model.name === "A3")?.derivatives
    ).toEqual([
      {
        bodyType: "hatchback",
        fromYear: 2004,
        name: "Sportback",
        slug: "sportback",
      },
      {
        bodyType: "sedan",
        fromYear: 2013,
        name: "Limousine",
        slug: "limousine",
      },
      {
        bodyType: "hatchback",
        fromYear: 2024,
        name: "allstreet",
        slug: "allstreet",
      },
      {
        bodyType: "convertible",
        fromYear: 2008,
        name: "Cabriolet",
        slug: "cabriolet",
        toYear: 2020,
      },
    ]);
  });
});
