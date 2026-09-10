import { describe, expect, it } from "vitest";
import { createLocalizedMetadata } from "./metadata";

describe("Day & Night localized metadata", () => {
  it("brands Bulgarian pages and emits canonical locale metadata", () => {
    const metadata = createLocalizedMetadata({
      baseUrl: "https://day-night.example",
      description: "Автомобили в България",
      locale: "bg-BG",
      path: "/cars",
      title: "Автомобили",
    });

    expect(metadata.title).toBe("Автомобили | Day & Night Auto Group");
    expect(metadata.applicationName).toBe("Day & Night Auto Group");
    expect(metadata.alternates?.canonical).toBe(
      "https://day-night.example/bg/cars"
    );
    expect(metadata.alternates?.languages).toEqual({
      en: "https://day-night.example/cars",
      "bg-BG": "https://day-night.example/bg/cars",
      "x-default": "https://day-night.example/cars",
    });
    expect(metadata.openGraph?.locale).toBe("bg_BG");
    expect(metadata.openGraph?.url).toBe("https://day-night.example/bg/cars");
  });

  it("limits alternates when a route is not translated", () => {
    const metadata = createLocalizedMetadata({
      alternateLocales: ["en"],
      baseUrl: "https://day-night.example",
      description: "English-only article",
      locale: "en",
      path: "/blog/launch-notes",
      title: "Launch notes",
    });

    expect(metadata.alternates?.languages).toEqual({
      en: "https://day-night.example/blog/launch-notes",
      "x-default": "https://day-night.example/blog/launch-notes",
    });
  });
});
