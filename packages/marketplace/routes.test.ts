import { describe, expect, it } from "vitest";
import {
  deslugMakeModel,
  getCollectionPath,
  getMakePath,
  getModelPath,
  slugifyMakeModel,
} from "./routes";

describe("public marketplace paths", () => {
  it("builds stable make and model slugs", () => {
    expect(slugifyMakeModel("Mercedes-Benz")).toBe("mercedes-benz");
    expect(getMakePath("BMW")).toBe("/cars/bmw");
    expect(getModelPath("BMW", "3 Series")).toBe("/cars/bmw/3-series");
  });

  it("resolves a slug only from known values", () => {
    expect(deslugMakeModel("3-series", ["1 Series", "3 Series"])).toBe(
      "3 Series"
    );
    expect(deslugMakeModel("unknown", ["1 Series"])).toBeUndefined();
  });

  it("builds collection paths", () => {
    expect(getCollectionPath("chinese-ev-hybrids")).toBe(
      "/collections/chinese-ev-hybrids"
    );
  });
});
