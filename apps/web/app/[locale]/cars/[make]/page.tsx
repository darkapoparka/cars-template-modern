import type { Metadata } from "next";
import { createCategoryMetadata } from "@/lib/public-route-metadata";
import {
  MakeModelMarketplacePage,
  resolveMakeModelRoute,
} from "../../components/make-model-marketplace-page";

interface PageProps {
  params: Promise<{ locale: string; make: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = async ({
  params,
  searchParams,
}: PageProps): Promise<Metadata> => {
  const [{ locale, make: makeSlug }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  try {
    const resolved = await resolveMakeModelRoute(makeSlug);
    return createCategoryMetadata({
      category: "car",
      locale,
      make: resolved?.make,
      path: resolved?.path ?? `/cars/${makeSlug}`,
      searchParams: query,
    });
  } catch {
    return createCategoryMetadata({
      category: "car",
      locale,
      path: `/cars/${makeSlug}`,
      searchParams: query,
    });
  }
};

export default async function MakePage({ params, searchParams }: PageProps) {
  const { locale, make } = await params;
  return (
    <MakeModelMarketplacePage
      locale={locale}
      makeSlug={make}
      searchParams={await searchParams}
    />
  );
}
