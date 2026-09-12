import { describe, expect, it } from "vitest";
import { getPublicDataMode } from "./public-data-policy";

describe("public marketplace data policy", () => {
  it("never enables demo inventory in production without a static showroom opt-in", () => {
    expect(getPublicDataMode({ nodeEnv: "production" })).toBe("unavailable");
    expect(
      getPublicDataMode({
        databaseUrl: "postgres://configured",
        nodeEnv: "production",
        requestedMode: "demo",
        skipEnvValidation: "true",
      })
    ).toBe("unavailable");
  });

  it("keeps explicitly configured static showrooms available without a database", () => {
    expect(
      getPublicDataMode({
        nodeEnv: "production",
        databaseUrl: "",
        skipEnvValidation: "true",
        staticDemoMode: true,
      })
    ).toBe("demo");
  });

  it("defaults local development to demo inventory", () => {
    expect(getPublicDataMode({ nodeEnv: "development" })).toBe("demo");
    expect(
      getPublicDataMode({
        databaseUrl: "postgres://configured",
        nodeEnv: "development",
      })
    ).toBe("demo");
  });

  it("requires an explicit local opt-in before using a database", () => {
    expect(
      getPublicDataMode({
        nodeEnv: "development",
        requestedMode: "database",
      })
    ).toBe("unavailable");
    expect(
      getPublicDataMode({
        databaseUrl: "postgres://configured",
        nodeEnv: "development",
        requestedMode: "database",
      })
    ).toBe("database");
  });

  it("uses configured durable inventory in production", () => {
    expect(
      getPublicDataMode({
        databaseUrl: "postgres://configured",
        nodeEnv: "production",
      })
    ).toBe("database");
  });
});
