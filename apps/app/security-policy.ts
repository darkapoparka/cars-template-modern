interface AppSecurityPolicyConfiguration {
  readonly apiUrl?: string;
  readonly clerkKeylessDevelopment?: boolean;
  readonly googleAnalytics?: boolean;
  readonly posthogHost?: string;
  readonly sentryDsn?: string;
  readonly vercelAnalytics?: boolean;
}

const getOptionalHttpOrigin = (value: string | undefined) => {
  const normalized = value?.trim();
  if (!normalized) {
    return;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : undefined;
  } catch {
    return;
  }
};

const uniqueSources = (...sources: ReadonlyArray<string | undefined>) =>
  Array.from(new Set(sources.filter((source): source is string => !!source)));

export const createAppContentSecurityPolicyDirectives = ({
  apiUrl,
  clerkKeylessDevelopment = false,
  googleAnalytics = false,
  posthogHost,
  sentryDsn,
  vercelAnalytics = false,
}: AppSecurityPolicyConfiguration = {}) => {
  const apiOrigin = getOptionalHttpOrigin(apiUrl);
  const posthogOrigin = getOptionalHttpOrigin(posthogHost);
  const sentryOrigin = getOptionalHttpOrigin(sentryDsn);
  const googleAnalyticsOrigin = googleAnalytics
    ? "https://*.google-analytics.com"
    : undefined;
  const googleTagManagerOrigin = googleAnalytics
    ? "https://www.googletagmanager.com"
    : undefined;

  return {
    "connect-src": uniqueSources(
      "https://vercel.com/api/blob/",
      clerkKeylessDevelopment ? "https://*.clerk.accounts.dev" : undefined,
      apiOrigin,
      posthogOrigin,
      sentryOrigin,
      googleAnalyticsOrigin,
      googleTagManagerOrigin,
      vercelAnalytics ? "https://vitals.vercel-insights.com" : undefined
    ),
    "img-src": uniqueSources(
      "data:",
      "https://*.public.blob.vercel-storage.com",
      googleAnalyticsOrigin,
      googleTagManagerOrigin
    ),
    "script-src": uniqueSources(
      googleTagManagerOrigin,
      vercelAnalytics ? "https://va.vercel-scripts.com" : undefined
    ),
  };
};

export const appContentSecurityPolicyDirectives =
  createAppContentSecurityPolicyDirectives({
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    clerkKeylessDevelopment:
      process.env.NODE_ENV !== "production" &&
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim(),
    googleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    vercelAnalytics: Boolean(process.env.VERCEL),
  });
