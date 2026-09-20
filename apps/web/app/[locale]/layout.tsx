import { createBrandTheme } from "@repo/design-system/lib/brand-theme";
import { withBasePath } from "@repo/internationalization/paths";
import { publicSite } from "@repo/marketplace/site-config";
import { LocalePreferencesProvider } from "@repo/marketplace-ui/components/locale-preferences";
import { getRequestPreferences } from "@/lib/locale-preferences";
import { isStaticPublicPreview } from "@/lib/public-data-policy";
import "./styles.css";
import "./mobile-final-polish.css";
import { analyticsConsentBootstrapScript } from "@repo/analytics";
import { AnalyticsProvider } from "@repo/analytics/provider";
import { Toaster } from "@repo/design-system/components/ui/sonner";
import { TooltipProvider } from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { ThemeProvider } from "@repo/design-system/providers/theme";
import { Toolbar } from "@repo/feature-flags/components/toolbar";
import { isLocale, normalizeLocale } from "@repo/internationalization";
import { leadSite } from "@repo/marketplace";
import { getLocalizedPath } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { fonts } from "@/lib/fonts";
import { isPublicContactSubmissionAvailable } from "@/lib/public-contact-readiness";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { MobileFinancingInterceptor } from "./components/mobile-financing-interceptor";
import { MobileVisibleViewport } from "./components/mobile-visible-viewport";

interface RootLayoutProperties {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  applicationName: leadSite.name,
  icons: {
    icon: [{ type: "image/png", url: withBasePath(leadSite.logoPath) }],
  },
  metadataBase: new URL(getPublicWebBaseUrl()),
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const normalizedLocale = normalizeLocale(locale);
  const preferences = await getRequestPreferences(normalizedLocale);

  return (
    <html
      className={cn(fonts, "scroll-smooth")}
      data-scroll-behavior="smooth"
      data-site-kind={publicSite.kind}
      dir="ltr"
      lang={normalizedLocale}
      style={createBrandTheme(publicSite.theme.accent)}
      suppressHydrationWarning
    >
      <head>
        {isStaticPublicPreview() ? null : (
          <script id="analytics-consent-bootstrap">
            {analyticsConsentBootstrapScript}
          </script>
        )}
      </head>
      <body>
        <noscript>
          <a
            className="inline-flex min-h-11 items-center px-4 underline"
            href={`${withBasePath(getLocalizedPath(normalizedLocale, "/locale-settings"))}?returnTo=${encodeURIComponent(preferences.returnTo)}`}
          >
            {normalizedLocale === "bg"
              ? "Държава и език"
              : "Country and language"}
          </a>
        </noscript>
        <MobileVisibleViewport />
        <ThemeProvider enableSystem={false} forcedTheme="light">
          <LocalePreferencesProvider {...preferences}>
            {isStaticPublicPreview() ? (
              <TooltipProvider>{children}</TooltipProvider>
            ) : (
              <AnalyticsProvider
                locale={normalizedLocale}
                privacyHref={getLocalizedPath(
                  normalizedLocale,
                  "/legal/privacy"
                )}
                vercelAnalyticsEnabled={Boolean(process.env.VERCEL)}
              >
                <TooltipProvider>{children}</TooltipProvider>
              </AnalyticsProvider>
            )}
            <MobileFinancingInterceptor
              locale={normalizedLocale}
              submissionAvailable={isPublicContactSubmissionAvailable()}
            />
            <Toaster />
          </LocalePreferencesProvider>
        </ThemeProvider>
        {isStaticPublicPreview() ||
        process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E === "true" ? null : (
          <Toolbar />
        )}
      </body>
    </html>
  );
};

export default RootLayout;
