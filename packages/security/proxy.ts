import { defaults, type Options, withVercelToolbar } from "@nosecone/next";

export { createMiddleware as securityMiddleware } from "@nosecone/next";

type ContentSecurityPolicyOptions = Exclude<
  Options["contentSecurityPolicy"],
  boolean | undefined
>;
type ContentSecurityPolicyDirectives = NonNullable<
  ContentSecurityPolicyOptions["directives"]
>;
type ConnectSourceList = Exclude<
  ContentSecurityPolicyDirectives["connectSrc"],
  boolean | null | undefined
>;
type ContentSecurityPolicySource =
  ConnectSourceList extends ReadonlyArray<infer Source> ? Source : never;

export interface PublicNoseconeConfiguration {
  apiUrl?: string;
  development?: boolean;
  googleAnalytics?: boolean;
  posthogHost?: string;
  sentryDsn?: string;
  vercelAnalytics?: boolean;
}

const asContentSecurityPolicySource = (
  value: string
): ContentSecurityPolicySource => value as ContentSecurityPolicySource;

const uniqueSources = (
  ...values: ReadonlyArray<string | undefined>
): ContentSecurityPolicySource[] =>
  Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  ).map(asContentSecurityPolicySource);

const getOptionalHttpOrigin = (value: string | undefined) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return;
  }

  try {
    const url = new URL(normalizedValue);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : undefined;
  } catch {
    return;
  }
};

// Nosecone security headers configuration
// https://docs.arcjet.com/nosecone/quick-start
export const noseconeOptions: Options = {
  ...defaults,
  // Clerk owns CSP in apps/app so it can generate and propagate a compatible
  // per-request nonce. Nosecone supplies the remaining security headers.
  contentSecurityPolicy: false,
};

export const noseconeOptionsWithToolbar: Options =
  withVercelToolbar(noseconeOptions);

/**
 * Public Next.js pages are deliberately compatible with static rendering, so
 * their CSP cannot depend on the per-request nonce owned by Clerk in apps/app.
 * Keep external browser origins opt-in and reduce configured URLs to origins
 * so credentials, paths, and query strings never enter a response header.
 */
export const createPublicNoseconeOptions = ({
  apiUrl,
  development = false,
  googleAnalytics = false,
  posthogHost,
  sentryDsn,
  vercelAnalytics = false,
}: PublicNoseconeConfiguration = {}): Options => {
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
    ...defaults,
    // Public listing pages embed third-party maps. COEP=require-corp would
    // block Google's iframe because its response does not opt into CORP.
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        ...defaults.contentSecurityPolicy.directives,
        connectSrc: uniqueSources(
          "'self'",
          "https://vercel.com/api/blob/",
          apiOrigin,
          development ? "ws://localhost:*" : undefined,
          development ? "ws://127.0.0.1:*" : undefined,
          posthogOrigin,
          sentryOrigin,
          vercelAnalytics ? "https://vitals.vercel-insights.com" : undefined,
          googleAnalyticsOrigin,
          googleTagManagerOrigin
        ),
        imgSrc: uniqueSources(
          "'self'",
          "data:",
          "https://*.public.blob.vercel-storage.com",
          "https://assets.basehub.com",
          "https://images.unsplash.com",
          googleAnalyticsOrigin,
          googleTagManagerOrigin
        ),
        frameSrc: uniqueSources(
          "'self'",
          // The public listing detail page embeds the showroom map here.
          "https://www.google.com",
          "https://maps.google.com",
          "https://www.googleusercontent.com"
        ),
        scriptSrc: uniqueSources(
          "'self'",
          // Next emits inline bootstrap scripts for statically rendered pages.
          "'unsafe-inline'",
          development ? "'unsafe-eval'" : undefined,
          posthogOrigin,
          googleTagManagerOrigin,
          vercelAnalytics ? "https://va.vercel-scripts.com" : undefined
        ),
        styleSrc: uniqueSources("'self'", "'unsafe-inline'"),
      },
    },
  };
};

export const createPublicNoseconeOptionsWithToolbar = (
  configuration: PublicNoseconeConfiguration = {}
): Options => withVercelToolbar(createPublicNoseconeOptions(configuration));
