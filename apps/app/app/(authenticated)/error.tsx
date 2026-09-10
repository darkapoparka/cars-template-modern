"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card } from "@repo/design-system/components/ui/card";
import { captureException } from "@sentry/nextjs";
import { AlertTriangleIcon, HouseIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface WorkspaceErrorProperties {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const WorkspaceError = ({ error, reset }: WorkspaceErrorProperties) => {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-start justify-center px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Card className="w-full max-w-xl gap-0 overflow-hidden py-0 shadow-panel">
        <div className="flex items-center gap-3 border-border/80 border-b bg-control/60 px-4 py-3 sm:px-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangleIcon aria-hidden="true" className="size-4.5" />
          </span>
          <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
            AutoMarket · Моето пространство
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div
            aria-describedby="workspace-error-description"
            aria-labelledby="workspace-error-title"
            role="alert"
          >
            <h1
              className="font-semibold text-foreground text-xl tracking-tight sm:text-2xl"
              id="workspace-error-title"
            >
              Пространството временно не е достъпно
            </h1>
            <p
              className="mt-2 max-w-lg text-muted-foreground text-sm leading-6"
              id="workspace-error-description"
            >
              Не успяхме да заредим текущите данни и не показваме примерна
              информация на тяхно място. Опитайте отново след момент.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 min-[420px]:flex-row">
            <Button
              className="h-10 min-w-36"
              onClick={reset}
              size="lg"
              type="button"
            >
              <RotateCcwIcon aria-hidden="true" />
              Опитай отново
            </Button>
            <Button
              asChild
              className="h-10 min-w-36"
              size="lg"
              variant="outline"
            >
              <Link href="/">
                <HouseIcon aria-hidden="true" />
                Към началото
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
};

export default WorkspaceError;
