"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { captureException } from "@sentry/nextjs";
import { RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

const AuthenticationError = ({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) => {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <section aria-labelledby="authentication-error-title" role="alert">
      <h1 className="font-semibold text-xl" id="authentication-error-title">
        Входът временно не е достъпен
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Защитеният доставчик не отговори. Опитайте отново; не въвеждайте данни
        за вход извън този екран.
      </p>
      <Button className="mt-5" onClick={reset} type="button">
        <RotateCcwIcon aria-hidden="true" />
        Опитай отново
      </Button>
    </section>
  );
};

export default AuthenticationError;
