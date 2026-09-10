import {
  type ListingInput,
  listingInputSchema,
} from "@repo/marketplace-domain/listing-input";

export {
  type ListingInput,
  listingInputSchema,
} from "@repo/marketplace-domain/listing-input";

export const listingInputFromFormData = (formData: FormData): ListingInput =>
  listingInputSchema.parse({
    bodyType: formData.get("bodyType"),
    category: formData.get("category"),
    colorExterior: formData.get("colorExterior") || undefined,
    description: formData.get("description"),
    enginePowerHp: formData.get("enginePowerHp") || undefined,
    fuelType: formData.get("fuelType"),
    locationCity: formData.get("locationCity"),
    locationCountry: formData.get("locationCountry") || "Bulgaria",
    locationRegion: formData.get("locationRegion") || undefined,
    make: formData.get("make"),
    mileageValue: formData.get("mileage"),
    model: formData.get("model"),
    monthlyAmount: formData.get("monthlyAmount") || undefined,
    priceAmount: formData.get("price"),
    priceCurrency: formData.get("currency"),
    priceType: formData.get("priceType"),
    title: formData.get("title"),
    transmission: formData.get("transmission"),
    trim: formData.get("trim") || undefined,
    vin: formData.get("vin") || undefined,
    year: formData.get("year"),
  });
