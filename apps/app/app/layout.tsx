import { env } from "@/env";
import "./styles.css";
import { AnalyticsProvider } from "@repo/analytics/provider";
import { AuthProvider } from "@repo/auth/provider";
import { Toaster } from "@repo/design-system/components/ui/sonner";
import { TooltipProvider } from "@repo/design-system/components/ui/tooltip";
import { fonts } from "@repo/design-system/lib/fonts";
import { ThemeProvider } from "@repo/design-system/providers/theme";
import { Toolbar } from "@repo/feature-flags/components/toolbar";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { appIndexingMetadata } from "./indexing-policy";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const localMetadataBase = "http://localhost:3000";

const getMetadataBase = (): URL => {
  try {
    return new URL(env.NEXT_PUBLIC_APP_URL ?? localMetadataBase);
  } catch {
    return new URL(localMetadataBase);
  }
};

const getUrl = (path: string, baseUrl?: string): string | undefined => {
  if (!baseUrl) {
    return undefined;
  }

  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return undefined;
  }
};

export const metadata: Metadata = {
  ...appIndexingMetadata,
  metadataBase: getMetadataBase(),
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="bg" suppressHydrationWarning>
    <body>
      <ThemeProvider>
        <AnalyticsProvider
          locale="bg"
          privacyHref={
            getUrl("/legal/privacy", env.NEXT_PUBLIC_WEB_URL) ??
            "/legal/privacy"
          }
          vercelAnalyticsEnabled={Boolean(process.env.VERCEL)}
        >
          <AuthProvider
            dynamic
            helpUrl={env.NEXT_PUBLIC_DOCS_URL}
            privacyUrl={getUrl("/legal/privacy", env.NEXT_PUBLIC_WEB_URL)}
            termsUrl={getUrl("/legal/terms", env.NEXT_PUBLIC_WEB_URL)}
          >
            <TooltipProvider>{children}</TooltipProvider>
          </AuthProvider>
        </AnalyticsProvider>
        <Toaster />
      </ThemeProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
