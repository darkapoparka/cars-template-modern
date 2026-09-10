import type { Metadata } from "next";
import { createCategoryMetadata } from "@/lib/public-route-metadata";
import { CategoryMarketplacePage } from "../components/category-marketplace-page";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = async ({
  params,
  searchParams,
}: PageProps): Promise<Metadata> =>
  createCategoryMetadata({
    category: "van",
    locale: (await params).locale,
    searchParams: await searchParams,
  });

export default async function VansPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  return (
    <CategoryMarketplacePage
      category="van"
      locale={locale}
      searchParams={await searchParams}
    />
  );
}
