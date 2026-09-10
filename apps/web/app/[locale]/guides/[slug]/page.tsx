import { Button } from "@repo/design-system/components/ui/button";
import { JsonLd } from "@repo/seo/json-ld";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { createSectionBreadcrumbStructuredData } from "@/lib/public-structured-data";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { getVehicleGuide, vehicleGuides } from "@/lib/vehicle-guides";
import { PublicMarketplaceFrame } from "../../components/public-marketplace-frame";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export const generateStaticParams = () =>
  vehicleGuides.map(({ slug }) => ({ slug }));

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { locale, slug } = await params;
  const guide = getVehicleGuide(slug);
  const language = locale === "bg" ? "bg" : "en";
  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description:
      guide?.description[language] ?? "Day & Night vehicle buying guide.",
    locale,
    path: `/guides/${slug}`,
    title: guide?.title[language] ?? "Vehicle guide",
  });
};

export default async function GuidePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const guide = getVehicleGuide(slug);
  if (!guide) {
    notFound();
  }
  const normalizedLocale = normalizeSeoLocale(locale);
  const language = normalizedLocale === "bg" ? "bg" : "en";
  return (
    <>
      <JsonLd
        code={createSectionBreadcrumbStructuredData({
          baseUrl: getPublicWebBaseUrl(),
          currentName: guide.title[language],
          currentPath: `/guides/${slug}`,
          locale: normalizedLocale,
          sectionName: language === "bg" ? "Съвети" : "Guides",
          sectionPath: "/guides",
        })}
      />
      <PublicMarketplaceFrame locale={locale}>
        <main className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
          <Button
            asChild
            className="min-h-11 rounded-lg lg:min-h-0"
            size="sm"
            variant="secondary"
          >
            <Link href={getLocalizedPath(normalizedLocale, "/guides")}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              {language === "bg" ? "Всички съвети" : "All guides"}
            </Link>
          </Button>
          <h1 className="mt-4 font-semibold text-page-title tracking-tight sm:text-page-title-lg">
            {guide.title[language]}
          </h1>
          <p className="mt-3 text-muted-foreground leading-7">
            {guide.description[language]}
          </p>
          <div className="mt-8 space-y-8">
            {guide.sections.map((section) => (
              <section key={section.heading.en}>
                <h2 className="font-semibold text-dialog-title">
                  {section.heading[language]}
                </h2>
                <p className="mt-3 text-foreground/80 leading-7">
                  {section.body[language]}
                </p>
              </section>
            ))}
          </div>
        </main>
      </PublicMarketplaceFrame>
    </>
  );
}
