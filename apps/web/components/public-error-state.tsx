"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { leadSite } from "@repo/marketplace";
import { LeadSiteMark } from "@repo/marketplace-ui";
import { captureException } from "@sentry/nextjs";
import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import { getPublicGlobalErrorCopy } from "@/lib/public-global-error";

interface PublicErrorStateProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export const PublicErrorState = ({ error, reset }: PublicErrorStateProps) => {
  const pathname = usePathname();
  const params = useParams<{ locale?: string }>();
  const copy = getPublicGlobalErrorCopy(
    params.locale === "bg" ? "/bg" : pathname
  );

  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-border border-b bg-card">
        <div className="mx-auto flex h-[68px] max-w-[96rem] items-center px-4 sm:px-6">
          <Link
            aria-label={leadSite.name}
            className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg font-semibold text-base tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xl"
            href={copy.homeHref}
          >
            <LeadSiteMark className="size-9 rounded-lg" />
            {leadSite.name}
          </Link>
        </div>
      </header>

      <main className="grid min-h-[calc(100dvh-68px)] place-items-center px-4 py-12">
        <section className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground text-xl">
            !
          </span>
          <h1 className="mt-5 font-semibold text-2xl tracking-tight">
            {copy.title}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm leading-6">
            {copy.description}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button className="min-h-11 lg:min-h-0" onClick={reset}>
              <RotateCcw aria-hidden="true" className="size-4" />
              {copy.retry}
            </Button>
            <Button asChild className="min-h-11 lg:min-h-0" variant="secondary">
              <Link href={copy.homeHref}>
                <Home aria-hidden="true" className="size-4" />
                {copy.home}
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};
