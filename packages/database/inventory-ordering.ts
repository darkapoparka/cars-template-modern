export interface InventoryFreshnessWindow {
  readonly confirmationAt: Date;
  readonly expiredAtReceipt: boolean;
  readonly freshUntil: Date;
}

export const getInventoryFreshnessWindow = (input: {
  readonly receivedAt: Date;
  readonly sourceGeneratedAt: Date;
  readonly staleAfterMinutes: number;
}): InventoryFreshnessWindow => {
  const confirmationAt = new Date(
    Math.min(input.receivedAt.getTime(), input.sourceGeneratedAt.getTime())
  );
  const freshUntil = new Date(
    confirmationAt.getTime() + input.staleAfterMinutes * 60_000
  );

  return {
    confirmationAt,
    expiredAtReceipt: freshUntil <= input.receivedAt,
    freshUntil,
  };
};

export const hasSameTimestampPayloadConflict = (input: {
  readonly existingPayloadHash: string | null;
  readonly existingSourceUpdatedAt: Date | null;
  readonly incomingPayloadHash: string;
  readonly incomingSourceUpdatedAt: Date;
}) =>
  Boolean(
    input.existingSourceUpdatedAt &&
      input.existingSourceUpdatedAt.getTime() ===
        input.incomingSourceUpdatedAt.getTime() &&
      input.existingPayloadHash !== input.incomingPayloadHash
  );

export const hasEqualBatchTimestampConflict = (input: {
  readonly incomingPayloadHash: string;
  readonly incomingSourceGeneratedAt: Date;
  readonly lastAppliedPayloadHash: string | null | undefined;
  readonly lastAppliedSourceGeneratedAt: Date | null;
}) =>
  Boolean(
    input.lastAppliedSourceGeneratedAt &&
      input.incomingSourceGeneratedAt.getTime() ===
        input.lastAppliedSourceGeneratedAt.getTime() &&
      input.lastAppliedPayloadHash !== input.incomingPayloadHash
  );
