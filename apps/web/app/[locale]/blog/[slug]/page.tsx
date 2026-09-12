import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { redirect } from "next/navigation";

interface BlogPostProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function BlogPostRedirect({ params }: BlogPostProps) {
  const { locale, slug } = await params;
  redirect(getLocalizedPath(normalizeSeoLocale(locale), `/guides/${slug}`));
}
