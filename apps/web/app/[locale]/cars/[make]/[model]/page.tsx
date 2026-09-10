import type { Metadata } from "next";
import { createCategoryMetadata } from "@/lib/public-route-metadata";
import {
  MakeModelMarketplacePage,
  resolveMakeModelRoute,
} from "../../../components/make-model-marketplace-page";

interface PageProps {
  params: Promise<{ locale: string; make: string; model: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = async ({
  params,
  searchParams,
}: PageProps): Promise<Metadata> => {
  const [{ locale, make: makeSlug, model: modelSlug }, query] =
    await Promise.all([params, searchParams]);

  try {
    const resolved = await resolveMakeModelRoute(makeSlug, modelSlug);
    return createCategoryMetadata({
      category: "car",
      locale,
      make: resolved?.make,
      model: resolved?.model,
      path: resolved?.path ?? `/cars/${makeSlug}/${modelSlug}`,
      searchParams: query,
    });
  } catch {
    return createCategoryMetadata({
      category: "car",
      locale,
      path: `/cars/${makeSlug}/${modelSlug}`,
      searchParams: query,
    });
  }
};

export default async function ModelPage({ params, searchParams }: PageProps) {
  const { locale, make, model } = await params;
  return (
    <MakeModelMarketplacePage
      locale={locale}
      makeSlug={make}
      modelSlug={model}
      searchParams={await searchParams}
    />
  );
}
