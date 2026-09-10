import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  stopSessionRecording: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthog }));
vi.mock("./keys", () => ({
  keys: () => ({
    NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST",
    NEXT_PUBLIC_POSTHOG_HOST: "https://analytics.example",
    NEXT_PUBLIC_POSTHOG_KEY: "public-test-key",
  }),
}));

const installBrowser = () => {
  const cookieWrites: string[] = [];
  const documentStub = {} as Document;
  Object.defineProperty(documentStub, "cookie", {
    configurable: true,
    get: () => "_ga=example; ph_public-test-key_posthog=example",
    set: (value: string) => cookieWrites.push(value),
  });
  const windowStub = {
    gtag: vi.fn(),
    location: {
      hostname: "www.automarket.bg",
      protocol: "https:",
    },
  };

  vi.stubGlobal("document", documentStub);
  vi.stubGlobal("window", windowStub);

  return { cookieWrites, windowStub };
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser analytics initialization", () => {
  it("uses explicit privacy-preserving PostHog configuration after consent", async () => {
    const { windowStub } = installBrowser();
    const { initializeAnalytics } = await import("./instrumentation-client");

    initializeAnalytics("granted");

    expect(posthog.init).toHaveBeenCalledWith(
      "public-test-key",
      expect.objectContaining({
        autocapture: false,
        cross_subdomain_cookie: false,
        defaults: "2026-05-30",
        disable_session_recording: true,
        opt_out_capturing_by_default: true,
        opt_out_persistence_by_default: true,
        persistence: "localStorage",
        person_profiles: "identified_only",
        respect_dnt: true,
      })
    );
    expect(posthog.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(
      (windowStub as typeof windowStub & Record<string, unknown>)[
        "ga-disable-G-TEST"
      ]
    ).toBe(false);
  });

  it("opts out and expires controllable provider cookies on revocation", async () => {
    const { cookieWrites, windowStub } = installBrowser();
    const { initializeAnalytics } = await import("./instrumentation-client");

    initializeAnalytics("granted");
    initializeAnalytics("denied");

    expect(posthog.stopSessionRecording).toHaveBeenCalledTimes(1);
    expect(posthog.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(cookieWrites.some((value) => value.startsWith("_ga="))).toBe(true);
    expect(
      cookieWrites.some((value) =>
        value.startsWith("ph_public-test-key_posthog=")
      )
    ).toBe(true);
    expect(windowStub.gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "denied",
    });
    expect(
      (windowStub as typeof windowStub & Record<string, unknown>)[
        "ga-disable-G-TEST"
      ]
    ).toBe(true);
  });
});
