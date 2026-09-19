"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { captureException } from "@sentry/nextjs";
import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect } from "react";
import { getPublicGlobalErrorCopy } from "@/lib/public-global-error";

import { PublicRecoveryFrame } from "./public-recovery-frame";

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
    <PublicRecoveryFrame
      desktopTitle={copy.title}
      locale={params.locale === "en" ? "en" : "bg"}
    >
      <main className="grid flex-1 place-items-center px-4 py-10">
        <section className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground text-xl">
            !
          </span>
          <h1
            className={
              isDealershipSite
                ? "mt-5 font-semibold text-2xl tracking-tight lg:hidden"
                : "mt-5 font-semibold text-2xl tracking-tight"
            }
          >
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
    </PublicRecoveryFrame>
  );
};
