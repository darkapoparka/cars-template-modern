import type { ProviderJobStatus } from "./dealer";
import type { BodyType, FuelType, Transmission } from "./types";

export interface VinDecodeInput {
  country?: string;
  vin: string;
}

export interface DecodedVinSpec {
  bodyType?: BodyType;
  derivative?: string;
  engineDisplacementCc?: number;
  enginePowerHp?: number;
  fuelType?: FuelType;
  make: string;
  model: string;
  transmission?: Transmission;
  trim?: string;
  vin: string;
  year: number;
}

export interface VinDecodeResult {
  provider: string;
  raw?: unknown;
  spec?: DecodedVinSpec;
  status: ProviderJobStatus;
}

export interface VinDecodeProvider {
  decodeVin(input: VinDecodeInput): Promise<VinDecodeResult>;
  name: string;
}

export interface PhotoProcessingInput {
  backdropPreset?: string;
  dealerOrgId?: string;
  imageId?: string;
  imageUrl: string;
  listingId?: string;
}

export interface PhotoProcessingResult {
  backdropPreset?: string;
  metadata?: Record<string, unknown>;
  originalUrl: string;
  processedUrl: string;
  provider: string;
  status: ProviderJobStatus;
}

export interface PhotoProcessingProvider {
  name: string;
  processPhoto(input: PhotoProcessingInput): Promise<PhotoProcessingResult>;
}

export interface ListingCopyInput {
  dealerDisplayName?: string;
  derivative?: string;
  make?: string;
  mileageValue?: number;
  model?: string;
  notes?: string;
  photoUrls?: string[];
  trim?: string;
  vin?: string;
  year?: number;
}

export interface ListingCopyResult {
  descriptionBg: string;
  descriptionEn: string;
  model?: string;
  promptVersion: string;
  provider: string;
  shortCopy: string;
  socialCaption: string;
  status: ProviderJobStatus;
  title: string;
}

export interface ListingCopyProvider {
  generateListingCopy(input: ListingCopyInput): Promise<ListingCopyResult>;
  name: string;
}
