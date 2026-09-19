import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { redirect } from "next/navigation";
import { requirePublicSitePath } from "@/lib/public-site-access";

interface BlogPostProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function BlogPostRedirect({ params }: BlogPostProps) {
  requirePublicSitePath("/blog");
  const { locale, slug } = await params;
  redirect(getLocalizedPath(normalizeSeoLocale(locale), `/guides/${slug}`));
}
