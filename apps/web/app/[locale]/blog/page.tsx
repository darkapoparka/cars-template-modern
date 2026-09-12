import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { redirect } from "next/navigation";

interface BlogProps {
  params: Promise<{ locale: string }>;
}

export default async function BlogRedirect({ params }: BlogProps) {
  const { locale } = await params;
  redirect(getLocalizedPath(normalizeSeoLocale(locale), "/guides"));
}
