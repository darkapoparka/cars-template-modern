import { Button } from "@repo/design-system/components/ui/button";
import { Card } from "@repo/design-system/components/ui/card";
import { ArrowLeftIcon, CarFrontIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";
import { getPublicWebBaseUrl } from "./marketplace-url";

const AuthenticatedNotFound = () => {
  const publicWebUrl = getPublicWebBaseUrl();

  return (
    <main className="flex min-h-[65svh] flex-1 items-start justify-center px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Card className="w-full max-w-xl gap-0 overflow-hidden py-0 shadow-panel">
        <div className="flex items-center gap-3 border-border/80 border-b bg-control/60 px-4 py-3 sm:px-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <SearchXIcon aria-hidden="true" className="size-4.5" />
          </span>
          <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
            AutoMarket · Моето пространство
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <section
            aria-describedby="authenticated-not-found-description"
            aria-labelledby="authenticated-not-found-title"
          >
            <h1
              className="font-semibold text-foreground text-xl tracking-tight sm:text-2xl"
              id="authenticated-not-found-title"
            >
              Страницата не е достъпна
            </h1>
            <p
              className="mt-2 max-w-lg text-muted-foreground text-sm leading-6"
              id="authenticated-not-found-description"
            >
              Адресът може да е невалиден или текущият профил да няма достъп до
              него. Защитените ресурси не се разкриват.
            </p>
          </section>

          <div className="mt-5 flex flex-col gap-2 min-[420px]:flex-row">
            <Button asChild className="h-10 min-w-36" size="lg">
              <Link href="/">
                <ArrowLeftIcon aria-hidden="true" />
                Към началото
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 min-w-36"
              size="lg"
              variant="outline"
            >
              <Link href={publicWebUrl}>
                <CarFrontIcon aria-hidden="true" />
                Към обявите
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
};

export default AuthenticatedNotFound;
