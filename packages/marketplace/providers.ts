import type {
  VinDecodeInput,
  VinDecodeProvider,
  VinDecodeResult,
} from "@repo/marketplace-domain/provider-ports";

export * from "@repo/marketplace-domain/provider-ports";

export const stubVinDecodeProvider = {
  name: "unconfigured",
  decodeVin(_input: VinDecodeInput): Promise<VinDecodeResult> {
    return Promise.resolve({
      provider: "unconfigured",
      status: "skipped",
    });
  },
} satisfies VinDecodeProvider;
