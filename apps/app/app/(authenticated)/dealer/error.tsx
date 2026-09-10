"use client";

import { SegmentError } from "../components/segment-error";

export default function DealerError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <SegmentError
      description="Не успяхме да заредим дилърските данни. Няма да покажем примерен инвентар на тяхно място."
      error={error}
      reset={reset}
      title="Dealer Studio временно не е достъпно"
    />
  );
}
