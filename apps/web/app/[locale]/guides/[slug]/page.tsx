import { JsonLd } from "@repo/seo/json-ld";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBlogPost, publicBlogPosts } from "@/lib/public-blog-posts";
import {
  parseContentSearch,
  serializeContentSearch,
} from "@/lib/public-content";
import {
  getContentHeroArtwork,
  getDesktopEditorialReading,
  getMobileContentHeroTitle,
  getPublicContentCards,
  getPublicContentCover,
  getRelatedContentCardTitle,
} from "@/lib/public-content-data";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { createSectionBreadcrumbStructuredData } from "@/lib/public-structured-data";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { getVehicleGuide, vehicleGuides } from "@/lib/vehicle-guides";
import { PublicEditorialArticle } from "../../components/public-editorial-article";
import { PublicMarketplaceFrame } from "../../components/public-marketplace-frame";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateStaticParams = () => [
  ...vehicleGuides.map(({ slug }) => ({ slug })),
  ...publicBlogPosts.map(({ slug }) => ({ slug })),
];

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { locale, slug } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const language = normalizedLocale === "bg" ? "bg" : "en";
  const guide = getVehicleGuide(slug);
  const post = getPublicBlogPost(slug);
  const title = post?.title[language] ?? guide?.title[language];
  const description = post?.excerpt[language] ?? guide?.description[language];
  if (!(title && description)) {
    return {};
  }
  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description,
    locale: normalizedLocale,
    path: `/guides/${slug}`,
    title,
  });
};

export default async function GuideOrArticlePage({
  params,
  searchParams,
}: PageProps) {
  requirePublicSitePath("/guides");
  const { locale, slug } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const language = normalizedLocale === "bg" ? "bg" : "en";
  const guide = getVehicleGuide(slug);
  const post = getPublicBlogPost(slug);
  const entry = post ?? guide;
  if (!entry) {
    notFound();
  }

  const title = post?.title[language] ?? guide?.title[language] ?? "";
  const description =
    post?.excerpt[language] ?? guide?.description[language] ?? "";
  const sections = post?.sections ?? guide?.sections ?? [];
  const guideEyebrow = language === "bg" ? "Ръководство" : "Guide";
  const eyebrow = post ? post.category[language] : guideEyebrow;
  const cover = getPublicContentCover(slug, entry.image);
  const backQuery = serializeContentSearch(
    parseContentSearch(await searchParams)
  );
  const otherContent = getPublicContentCards(language).filter(
    (card) => card.slug !== slug
  );
  const related = [
    ...otherContent.filter((card) => card.filter === entry.categoryId),
    ...otherContent.filter((card) => card.filter !== entry.categoryId),
  ]
    .slice(0, 2)
    .map((card) => ({
      category: card.category,
      href: `${getLocalizedPath(normalizedLocale, `/guides/${card.slug}`)}${backQuery}`,
      image: card.image,
      shortTitle: getRelatedContentCardTitle(card, language),
      title: card.title,
    }));

  return (
    <>
      <JsonLd
        code={createSectionBreadcrumbStructuredData({
          baseUrl: getPublicWebBaseUrl(),
          currentName: title,
          currentPath: `/guides/${slug}`,
          locale: normalizedLocale,
          sectionName:
            language === "bg" ? "Съвети и статии" : "Guides and articles",
          sectionPath: "/guides",
        })}
      />
      <PublicMarketplaceFrame
        locale={normalizedLocale}
        showMobileBottomNav={false}
        showMobileDealerHeader={false}
        showMobileFooter={false}
      >
        <PublicEditorialArticle
          backHref={`${getLocalizedPath(normalizedLocale, "/guides")}${backQuery}`}
          description={description}
          desktopReading={getDesktopEditorialReading(slug, language)}
          eyebrow={eyebrow}
          heroArtwork={getContentHeroArtwork(slug, language)}
          image={cover.image}
          imagePosition={cover.position}
          language={language}
          mobileTitle={getMobileContentHeroTitle({ slug, title }, language)}
          published={post?.published}
          readTime={post?.readTime[language]}
          related={related}
          sections={sections}
          title={title}
        />
      </PublicMarketplaceFrame>
    </>
  );
}
