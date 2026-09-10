import type { Metadata } from "next";
import type { ReactNode } from "react";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const localMetadataBase = "http://localhost:3002";
const absoluteUrlPattern = /^https?:\/\//;

const getMetadataBase = (): URL => {
  const configuredUrl =
    process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configuredUrl) {
    return new URL(localMetadataBase);
  }

  const absoluteUrl = absoluteUrlPattern.test(configuredUrl)
    ? configuredUrl
    : `https://${configuredUrl}`;

  try {
    return new URL(absoluteUrl);
  } catch {
    return new URL(localMetadataBase);
  }
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
