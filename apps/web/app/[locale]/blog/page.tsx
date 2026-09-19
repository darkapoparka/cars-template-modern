import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { redirect } from "next/navigation";
import { requirePublicSitePath } from "@/lib/public-site-access";

interface BlogProps {
  params: Promise<{ locale: string }>;
}

export default async function BlogRedirect({ params }: BlogProps) {
  requirePublicSitePath("/blog");
  const { locale } = await params;
  redirect(getLocalizedPath(normalizeSeoLocale(locale), "/guides"));
}
