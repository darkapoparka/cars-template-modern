"use client";

import { SegmentError } from "../components/segment-error";

export default function MessagesError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <SegmentError
      description="Не успяхме да заредим разговорите. Съобщенията не са заменени с примерни данни."
      error={error}
      reset={reset}
      title="Съобщенията временно не са достъпни"
    />
  );
}
