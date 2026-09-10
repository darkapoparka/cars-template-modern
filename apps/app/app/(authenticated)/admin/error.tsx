"use client";

import { SegmentError } from "../components/segment-error";

export default function AdminError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <SegmentError
      description="Не успяхме да заредим административните данни. Опитайте отново преди да предприемете действие."
      error={error}
      reset={reset}
      title="Администрацията временно не е достъпна"
    />
  );
}
