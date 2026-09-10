import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { keys } from "./keys";

beforeEach(() => {
  vi.stubEnv("SKIP_ENV_VALIDATION", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("observability environment", () => {
  it("normalizes blank optional Better Stack values to undefined", () => {
    vi.stubEnv("BETTERSTACK_API_KEY", "   ");
    vi.stubEnv("BETTERSTACK_URL", "");

    const environment = keys();

    expect(environment.BETTERSTACK_API_KEY).toBeUndefined();
    expect(environment.BETTERSTACK_URL).toBeUndefined();
  });

  it("rejects surrounding whitespace in configured Better Stack values", () => {
    vi.stubEnv("BETTERSTACK_API_KEY", "  status-api-key  ");
    vi.stubEnv("BETTERSTACK_URL", "  https://status.example.com  ");

    expect(() => keys()).toThrow("Invalid environment variables");
  });

  it("preserves canonical Better Stack values", () => {
    vi.stubEnv("BETTERSTACK_API_KEY", "status-api-key");
    vi.stubEnv("BETTERSTACK_URL", "https://status.example.com");

    const environment = keys();
    expect(environment.BETTERSTACK_API_KEY).toBe("status-api-key");
    expect(environment.BETTERSTACK_URL).toBe("https://status.example.com");
  });
});
