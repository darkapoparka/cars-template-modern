"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { useEffect, useState } from "react";

const providerDelayMs = 10_000;

export const AuthProviderLoading = ({ title }: { readonly title: string }) => {
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setIsDelayed(true),
      providerDelayMs
    );
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <section aria-busy="true" aria-labelledby="auth-provider-loading-title">
      <h1 className="font-semibold text-2xl" id="auth-provider-loading-title">
        {title}
      </h1>
      <output
        aria-live="polite"
        className="mt-2 block text-muted-foreground text-sm"
      >
        {isDelayed
          ? "Доставчикът за идентификация отговаря по-бавно от очакваното."
          : "Свързваме се със защитения доставчик за идентификация."}
      </output>
      {isDelayed ? (
        <Button
          className="mt-6 min-h-11"
          onClick={() => window.location.reload()}
          type="button"
          variant="outline"
        >
          Опитайте отново
        </Button>
      ) : (
        <div aria-hidden="true" className="mt-6 grid gap-4">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      )}
    </section>
  );
};
