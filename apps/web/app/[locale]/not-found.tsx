"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { leadSite } from "@repo/marketplace";
import {
  LeadSiteMark,
  marketplaceContentFrameClassName,
} from "@repo/marketplace-ui";
import { Home, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Footer } from "./components/footer";

const NotFound = () => {
  const params = useParams<{ locale?: string }>();
  const isBg = params.locale === "bg";
  const homeHref = isBg ? "/bg" : "/";
  const browseHref = isBg ? "/bg/cars" : "/cars";
  const pageTitle = isBg
    ? `Страницата не е намерена | ${leadSite.name}`
    : `Page not found | ${leadSite.name}`;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <title>{pageTitle}</title>
      <a
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-lg bg-foreground px-4 py-3 font-semibold text-background shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        href="#main-content"
      >
        {isBg ? "Към основното съдържание" : "Skip to main content"}
      </a>
      <header className="border-border border-b bg-card">
        <div
          className={`${marketplaceContentFrameClassName} flex h-[68px] items-center justify-between`}
        >
          <Link
            aria-label={leadSite.name}
            className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg font-semibold text-base tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl"
            href={homeHref}
          >
            <LeadSiteMark className="size-9 rounded-lg" />
            {leadSite.name}
          </Link>
          <Button
            asChild
            className="min-h-11 shrink-0 lg:min-h-0"
            size="sm"
            variant="secondary"
          >
            <Link href={browseHref}>
              <Search aria-hidden="true" className="size-4" />
              {isBg ? "Обяви" : "Listings"}
            </Link>
          </Button>
        </div>
      </header>

      <main
        className="grid min-h-[calc(100dvh-68px)] flex-1 place-items-center px-4 py-12"
        id="main-content"
        tabIndex={-1}
      >
        <section className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <p className="font-semibold text-[var(--lead-site-accent)] text-sm dark:text-[var(--lead-site-accent-bright)]">
            404
          </p>
          <h1 className="mt-2 font-semibold text-section-title tracking-tight">
            {isBg ? "Страницата не е намерена" : "Page not found"}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            {isBg
              ? "Адресът може да е променен или съдържанието вече да не е достъпно."
              : "The address may have changed, or the content may no longer be available."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="min-h-11 lg:min-h-0">
              <Link href={browseHref}>
                <Search aria-hidden="true" className="size-4" />
                {isBg ? "Разгледай обявите" : "Browse listings"}
              </Link>
            </Button>
            <Button asChild className="min-h-11 lg:min-h-0" variant="secondary">
              <Link href={homeHref}>
                <Home aria-hidden="true" className="size-4" />
                {isBg ? "Начало" : "Home"}
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer locale={isBg ? "bg" : "en"} />
    </div>
  );
};

export default NotFound;
