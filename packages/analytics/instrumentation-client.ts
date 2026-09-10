import posthog from "posthog-js";
import type { AnalyticsConsent } from "./consent";
import { keys } from "./keys";

let initialized = false;

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

const clearProviderCookies = () => {
  if (typeof document === "undefined") {
    return;
  }

  try {
    const cookieNames = document.cookie
      .split(";")
      .map((cookie) => cookie.split("=", 1)[0]?.trim())
      .filter(
        (name): name is string =>
          Boolean(name) &&
          (name.startsWith("_ga") ||
            name.startsWith("ph_") ||
            name.startsWith("__ph_opt_in_out_"))
      );
    const hostnameParts = window.location.hostname.split(".");
    const domainAttributes = [
      "",
      ...hostnameParts
        .slice(0, -1)
        .map((_, index) => `; Domain=.${hostnameParts.slice(index).join(".")}`),
    ];
    const secure = window.location.protocol === "https:" ? "; Secure" : "";

    for (const name of cookieNames) {
      for (const domain of domainAttributes) {
        // biome-ignore lint/suspicious/noDocumentCookie: expiring legacy analytics cookies must work without the optional Cookie Store API
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}${domain}`;
      }
    }
  } catch {
    // Browsers may block all cookie access in hardened privacy modes.
  }
};

const setGoogleAnalyticsDisabled = (disabled: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  const { NEXT_PUBLIC_GA_MEASUREMENT_ID } = keys();
  if (NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    (window as AnalyticsWindow & Record<string, unknown>)[
      `ga-disable-${NEXT_PUBLIC_GA_MEASUREMENT_ID}`
    ] = disabled;
  }

  if (disabled) {
    (window as AnalyticsWindow).gtag?.("consent", "update", {
      analytics_storage: "denied",
    });
    clearProviderCookies();
  }
};

export const initializeAnalytics = (consent: AnalyticsConsent = "unknown") => {
  if (consent !== "granted") {
    setGoogleAnalyticsDisabled(true);

    if (initialized) {
      posthog.stopSessionRecording();
      posthog.opt_out_capturing();
    }

    return;
  }

  const { NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST } = keys();
  setGoogleAnalyticsDisabled(false);

  if (!(NEXT_PUBLIC_POSTHOG_KEY && NEXT_PUBLIC_POSTHOG_HOST)) {
    return;
  }

  if (!initialized) {
    posthog.init(NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: NEXT_PUBLIC_POSTHOG_HOST,
      autocapture: false,
      cross_subdomain_cookie: false,
      defaults: "2026-05-30",
      disable_session_recording: true,
      opt_out_capturing_by_default: true,
      opt_out_persistence_by_default: true,
      persistence: "localStorage",
      person_profiles: "identified_only",
      respect_dnt: true,
    });
    initialized = true;
  }

  posthog.opt_in_capturing();
};
