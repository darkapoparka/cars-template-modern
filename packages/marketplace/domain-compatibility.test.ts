import {
  type InventoryRecord as DomainInventoryRecord,
  type ListingInput as DomainListingInput,
  type PublicLeadInput as DomainPublicLeadInput,
  type VehicleListing as DomainVehicleListing,
  inventoryBatchSchema as domainInventoryBatchSchema,
  isSourceManagedListing as domainIsSourceManagedListing,
  listingInputSchema as domainListingInputSchema,
  organizationDirectoryEntrySchema as domainOrganizationDirectoryEntrySchema,
  projectOrganizationVerification as domainProjectOrganizationVerification,
  publicLeadInputSchema as domainPublicLeadInputSchema,
} from "@repo/marketplace-domain";
import { parseInventoryCsvMappingDefinition as domainParseInventoryCsvMappingDefinition } from "@repo/marketplace-domain/inventory-csv";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
  type InventoryRecord as FeatureInventoryRecord,
  type ListingInput as FeatureListingInput,
  type PublicLeadInput as FeaturePublicLeadInput,
  type VehicleListing as FeatureVehicleListing,
  inventoryBatchSchema as featureInventoryBatchSchema,
  isSourceManagedListing as featureIsSourceManagedListing,
  listingInputSchema as featureListingInputSchema,
  organizationDirectoryEntrySchema as featureOrganizationDirectoryEntrySchema,
  projectOrganizationVerification as featureProjectOrganizationVerification,
  publicLeadInputSchema as featurePublicLeadInputSchema,
} from "./index";
import { parseInventoryCsvMappingDefinition as featureParseInventoryCsvMappingDefinition } from "./inventory-csv";

describe("marketplace domain compatibility", () => {
  test("keeps runtime schemas and policies single-source", () => {
    expect(featureListingInputSchema).toBe(domainListingInputSchema);
    expect(featurePublicLeadInputSchema).toBe(domainPublicLeadInputSchema);
    expect(featureInventoryBatchSchema).toBe(domainInventoryBatchSchema);
    expect(featureOrganizationDirectoryEntrySchema).toBe(
      domainOrganizationDirectoryEntrySchema
    );
    expect(featureProjectOrganizationVerification).toBe(
      domainProjectOrganizationVerification
    );
    expect(featureIsSourceManagedListing).toBe(domainIsSourceManagedListing);
    expect(featureParseInventoryCsvMappingDefinition).toBe(
      domainParseInventoryCsvMappingDefinition
    );
  });

  test("preserves the public contract types", () => {
    expectTypeOf<FeatureListingInput>().toEqualTypeOf<DomainListingInput>();
    expectTypeOf<FeaturePublicLeadInput>().toEqualTypeOf<DomainPublicLeadInput>();
    expectTypeOf<FeatureVehicleListing>().toEqualTypeOf<DomainVehicleListing>();
    expectTypeOf<FeatureInventoryRecord>().toEqualTypeOf<DomainInventoryRecord>();
  });
});
