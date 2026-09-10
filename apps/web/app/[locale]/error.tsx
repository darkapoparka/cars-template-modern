"use client";

import { PublicErrorState } from "@/components/public-error-state";

interface LocaleErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

const LocaleError = ({ error, reset }: LocaleErrorProps) => (
  <PublicErrorState error={error} reset={reset} />
);

export default LocaleError;
