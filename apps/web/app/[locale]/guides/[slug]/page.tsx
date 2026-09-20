import Image from "@repo/marketplace-ui/components/public-image";
import { JsonLd } from "@repo/seo/json-ld";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBlogPost, publicBlogPosts } from "@/lib/public-blog-posts";
import {
  parseContentSearch,
  serializeContentSearch,
} from "@/lib/public-content";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { createSectionBreadcrumbStructuredData } from "@/lib/public-structured-data";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { getVehicleGuide, vehicleGuides } from "@/lib/vehicle-guides";
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
  const guideEyebrow =
    language === "bg" ? "Практично ръководство" : "Practical guide";
  const eyebrow = post
    ? `${post.category[language]} · ${post.readTime[language]}`
    : guideEyebrow;
  const image = entry.image;
  const backQuery = serializeContentSearch(
    parseContentSearch(await searchParams)
  );

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
        desktopIntro={{ title, description, eyebrow, variant: "compact" }}
        locale={normalizedLocale}
        showMobileFooter={false}
      >
        <main className="min-h-[100dvh] bg-background px-4 py-5 lg:px-6 lg:py-10">
          <article className="mx-auto max-w-3xl">
            <Link
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 font-semibold text-compact-control text-zinc-800 focus-visible:outline-2 focus-visible:outline-zinc-950"
              href={`${getLocalizedPath(normalizedLocale, "/guides")}${backQuery}`}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {language === "bg" ? "Всички материали" : "All content"}
            </Link>

            <header className="pt-5 pb-4 lg:hidden">
              <p className="font-semibold text-micro text-muted-foreground uppercase tracking-label">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-balance font-semibold text-page-title text-zinc-950 tracking-heading lg:text-page-title-lg">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-body text-zinc-600">
                {description}
              </p>
            </header>

            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-200">
              <Image
                alt=""
                className="object-cover"
                fill
                priority
                sizes="(max-width: 768px) calc(100vw - 32px), 768px"
                src={image}
              />
            </div>

            <div className="mt-6 space-y-3">
              {sections.map((section, index) => (
                <section
                  className="rounded-2xl bg-white px-5 py-5 sm:px-6 sm:py-6 lg:border lg:border-border lg:shadow-panel"
                  key={section.heading.en}
                >
                  <p className="font-semibold text-micro text-muted-foreground tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 font-semibold text-section-title text-zinc-950 tracking-heading">
                    {section.heading[language]}
                  </h2>
                  <p className="mt-2 text-body text-zinc-600">
                    {section.body[language]}
                  </p>
                </section>
              ))}
            </div>

            <Link
              className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-zinc-950 px-5 py-4 font-semibold text-compact-control text-white focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-2"
              href={getLocalizedPath(normalizedLocale, "/cars")}
            >
              <span>
                {language === "bg"
                  ? "Разгледайте автомобилите"
                  : "Browse vehicles"}
              </span>
              <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
            </Link>
          </article>
        </main>
      </PublicMarketplaceFrame>
    </>
  );
}
