import { describe, expect, it } from "vitest";
import { isPublicImageSource } from "./public-images";

describe("public image sources", () => {
  it.each([
    "/dealer/car.webp",
    "https://images.unsplash.com/car.jpg?q=80",
    "https://assets.basehub.com/car.jpg",
    "https://dealer.public.blob.vercel-storage.com/car.webp",
  ])("accepts an owned local asset or configured optimizer host: %s", (source) => {
    expect(isPublicImageSource(source)).toBe(true);
  });
  it.each([
    "/\\external.test/car.jpg",
    "//images.unsplash.com/car.jpg",
    "javascript:alert(1)",
    "http://images.unsplash.com/car.jpg",
    "https://images.unsplash.com.external.test/car.jpg",
    "https://private@images.unsplash.com/car.jpg",
    "https://images.unsplash.com:8443/car.jpg",
    "https://public.blob.vercel-storage.com/car.jpg",
    "https://external.test/car.jpg",
    null,
  ])("rejects unsafe or unconfigured persisted image sources: %s", (source) => {
    expect(isPublicImageSource(source)).toBe(false);
  });
});
