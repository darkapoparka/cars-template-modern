import { Button } from "@repo/design-system/components/ui/button";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { vehicleGuides } from "@/lib/vehicle-guides";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description:
      locale === "bg"
        ? "Практични съвети за избор, покупка и проверка на автомобил в България."
        : "Practical guides for choosing, buying, and checking a vehicle in Bulgaria.",
    locale,
    path: "/guides",
    title: locale === "bg" ? "Съвети за автомобили" : "Vehicle guides",
  });
};

export default async function GuidesPage({ params }: PageProps) {
  const { locale } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const language = normalizedLocale === "bg" ? "bg" : "en";
  return (
    <PublicMarketplaceFrame locale={locale}>
      <main className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
        <h1 className="font-semibold text-page-title tracking-tight sm:text-page-title-lg">
          {language === "bg" ? "Съвети за автомобили" : "Vehicle guides"}
        </h1>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          {language === "bg"
            ? "Кратки, практични материали за по-информиран избор. Те не заменят независим технически или правен съвет."
            : "Short, practical material for a more informed choice. It does not replace independent technical or legal advice."}
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {vehicleGuides.map((guide) => (
            <article
              className="rounded-xl border border-border bg-card p-5"
              key={guide.slug}
            >
              <h2 className="font-semibold text-card-title">
                {guide.title[language]}
              </h2>
              <p className="mt-2 text-meta text-muted-foreground">
                {guide.description[language]}
              </p>
              <Button
                asChild
                className="mt-4 min-h-11 lg:min-h-0"
                size="sm"
                variant="outline"
              >
                <Link
                  href={getLocalizedPath(
                    normalizedLocale,
                    `/guides/${guide.slug}`
                  )}
                  prefetch={false}
                >
                  {language === "bg" ? "Прочети" : "Read guide"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </main>
    </PublicMarketplaceFrame>
  );
}
