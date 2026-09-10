import merge from "lodash.merge";
import type { Metadata } from "next";
import {
  getCanonicalBaseUrl,
  getCanonicalUrl,
  getLanguageAlternates,
  getLocalizedPath,
  normalizeSeoLocale,
  SEO_OPEN_GRAPH_LOCALES,
  type SeoLocale,
} from "./urls";

type MetadataGenerator = Omit<Metadata, "description" | "title"> & {
  description: string;
  image?: string;
  siteName?: string;
  title: string;
};

type LocalizedMetadataGenerator = MetadataGenerator & {
  alternateLocales?: readonly SeoLocale[];
  baseUrl: string | URL;
  locale: string;
  path: string;
};

export const DEFAULT_APPLICATION_NAME = "Day & Night Auto Group";

const applicationName = DEFAULT_APPLICATION_NAME;
const publisher = DEFAULT_APPLICATION_NAME;
const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

const getMetadataBase = (): URL | undefined => {
  const configuredUrl = process.env.NEXT_PUBLIC_WEB_URL ?? productionUrl;

  if (!configuredUrl) {
    return undefined;
  }

  const absoluteUrl =
    configuredUrl.startsWith("http://") || configuredUrl.startsWith("https://")
      ? configuredUrl
      : `${protocol}://${configuredUrl}`;

  return getCanonicalBaseUrl(absoluteUrl);
};

export const createMetadata = ({
  title,
  description,
  image,
  siteName,
  ...properties
}: MetadataGenerator): Metadata => {
  const resolvedApplicationName = siteName ?? applicationName;
  const resolvedAuthor: Metadata["authors"] = {
    name: resolvedApplicationName,
  };
  const parsedTitle = `${title} | ${resolvedApplicationName}`;
  const defaultMetadata: Metadata = {
    title: parsedTitle,
    description,
    applicationName: resolvedApplicationName,
    metadataBase: getMetadataBase(),
    authors: [resolvedAuthor],
    creator: resolvedApplicationName,
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: parsedTitle,
    },
    openGraph: {
      title: parsedTitle,
      description,
      type: "website",
      siteName: resolvedApplicationName,
      locale: "en_US",
    },
    publisher: siteName ?? publisher,
    twitter: {
      card: "summary_large_image",
    },
  };

  const metadata: Metadata = merge(defaultMetadata, properties);

  if (image && metadata.openGraph) {
    metadata.openGraph.images = [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  return metadata;
};

export const createLocalizedMetadata = ({
  alternateLocales,
  baseUrl,
  locale,
  path,
  ...properties
}: LocalizedMetadataGenerator): Metadata => {
  const normalizedLocale: SeoLocale = normalizeSeoLocale(locale);
  const localizedPath = getLocalizedPath(normalizedLocale, path);
  const canonicalUrl = getCanonicalUrl(localizedPath, { baseUrl });

  return createMetadata({
    ...properties,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(path, {
        baseUrl,
        locales: alternateLocales,
      }),
      ...properties.alternates,
    },
    metadataBase: getCanonicalBaseUrl(baseUrl),
    openGraph: {
      locale: SEO_OPEN_GRAPH_LOCALES[normalizedLocale],
      url: canonicalUrl,
      ...properties.openGraph,
    },
  });
};

export type { SeoLocale } from "./urls";
export {
  DEFAULT_SEO_LOCALE,
  getCanonicalBaseUrl,
  getCanonicalUrl,
  getLanguageAlternates,
  getLocalizedPath,
  normalizeSeoLocale,
  SEO_LANGUAGE_TAGS,
  SEO_LOCALES,
  SEO_OPEN_GRAPH_LOCALES,
} from "./urls";
