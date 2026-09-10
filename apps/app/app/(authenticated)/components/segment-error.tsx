"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card } from "@repo/design-system/components/ui/card";
import { captureException } from "@sentry/nextjs";
import { RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

export const SegmentError = ({
  description,
  error,
  reset,
  title,
}: {
  readonly description: string;
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  readonly title: string;
}) => {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-start justify-center p-3 sm:p-6">
      <Card className="w-full max-w-xl p-5 sm:p-6">
        <div aria-labelledby="segment-error-title" role="alert">
          <h1 className="font-semibold text-xl" id="segment-error-title">
            {title}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">{description}</p>
        </div>
        <Button className="mt-5" onClick={reset} type="button">
          <RotateCcwIcon aria-hidden="true" />
          Опитай отново
        </Button>
      </Card>
    </main>
  );
};
