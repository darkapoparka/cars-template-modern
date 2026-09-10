import { Button } from "@repo/design-system/components/ui/button";
import { leadSite } from "@repo/marketplace";
import type { Blog, WithContext } from "@repo/seo/json-ld";
import { JsonLd } from "@repo/seo/json-ld";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowRight, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";

interface BlogProps {
  params: Promise<{
    locale: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: BlogProps): Promise<Metadata> => {
  const { locale } = await params;
  const isBg = normalizeSeoLocale(locale) === "bg";

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? "Практични материали от Day & Night за избор на автомобил, внос, оглед и финансиране."
      : "Practical Day & Night guidance on choosing, importing, inspecting, and financing a vehicle.",
    locale,
    path: "/blog",
    title: isBg ? "Новини и анализи" : "News and insights",
  });
};

const BlogIndex = async ({ params }: BlogProps) => {
  const { locale } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const isBg = normalizedLocale === "bg";
  const localize = (path: string) => getLocalizedPath(normalizedLocale, path);
  const jsonLd: WithContext<Blog> = {
    "@context": "https://schema.org",
    "@type": "Blog",
    description: isBg
      ? "Практични материали от Day & Night за вноса и избора на автомобил."
      : "Practical Day & Night guidance on importing and choosing a vehicle.",
    inLanguage: isBg ? "bg-BG" : "en",
    name: isBg ? "Новини и анализи" : "News and insights",
    publisher: {
      "@type": "Organization",
      name: leadSite.name,
    },
    url: new URL(localize("/blog"), getPublicWebBaseUrl()).toString(),
  };

  return (
    <PublicMarketplaceFrame locale={normalizedLocale}>
      <JsonLd code={jsonLd} />
      <main className="mx-auto min-h-[60dvh] max-w-[90rem] px-4 py-8 lg:px-6 lg:py-10">
        <header className="max-w-2xl">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.12em]">
            Day &amp; Night
          </p>
          <h1 className="mt-2 font-semibold text-page-title tracking-tight sm:text-page-title-lg">
            {isBg ? "Новини и анализи" : "News and insights"}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            {isBg
              ? "Практични материали за избор на автомобил, внос, оглед и финансиране."
              : "Practical guidance on choosing, importing, inspecting, and financing a vehicle."}
          </p>
        </header>

        <section className="mt-7 rounded-xl border border-border bg-card px-5 py-10 text-center sm:px-8">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
            <Newspaper aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 font-semibold text-lg">
            {isBg
              ? "Подготвяме първите статии"
              : "Our first articles are on the way"}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground text-sm leading-6">
            {isBg
              ? "Междувременно разгледайте практичните ни ръководства за покупка и проверка на автомобил."
              : "In the meantime, browse our practical guides to buying and checking a vehicle."}
          </p>
          <Button asChild className="mt-5" size="sm" variant="secondary">
            <Link href={localize("/guides")}>
              {isBg ? "Към съветите" : "Browse guides"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </section>
      </main>
    </PublicMarketplaceFrame>
  );
};

export default BlogIndex;
