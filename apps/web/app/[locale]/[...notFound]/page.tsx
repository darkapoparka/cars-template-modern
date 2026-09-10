import { leadSite } from "@repo/marketplace";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface UnknownLocalizedPageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: UnknownLocalizedPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isBg = locale === "bg";

  return {
    robots: {
      follow: false,
      index: false,
    },
    title: isBg
      ? `Страницата не е намерена | ${leadSite.name}`
      : `Page not found | ${leadSite.name}`,
  };
};

const UnknownLocalizedPage = () => notFound();

export default UnknownLocalizedPage;
