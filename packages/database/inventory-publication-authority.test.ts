import { requiredSupplierCapabilities } from "@repo/marketplace-domain";
import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "./generated/client";
import {
  type AuthorityPublication,
  findCurrentPublicMarketplacePublicationForInquiry,
  isPublicationAuthorityCurrent,
} from "./inventory-publication-authority";

const now = new Date("2026-09-19T12:00:00Z");
const future = new Date("2026-09-20T12:00:00Z");
const past = new Date("2026-09-18T12:00:00Z");
const fixture = () =>
  ({
    id: "publication-a",
    marketId: "market-a",
    market: { status: "active" },
    marketPermission: { status: "active", validFrom: past, validUntil: future },
    inventoryRightsGrant: {
      status: "active",
      inventorySourceId: "source-a",
      marketId: "market-a",
      validFrom: past,
      validUntil: future,
    },
    supplierOffer: {
      inventorySourceId: "source-a",
      status: "available",
      freshUntil: future,
      inventorySource: {
        deletedAt: null,
        status: "active",
        mediaRightsStatus: "active",
      },
      supplierOrg: {
        deletedAt: null,
        onboardingStatus: "approved",
        kybStatus: "verified",
        kybExpiresAt: future,
        capabilities: requiredSupplierCapabilities.map((capabilityKey) => ({
          capabilityKey,
          status: "active",
          expiresAt: future,
        })),
        supplierTrust: [{ status: "verified", expiresAt: future }],
      },
    },
  }) as unknown as AuthorityPublication;

describe("current inventory publication authority", () => {
  it("allows only a currently authorized publication, including a degraded but active source", () => {
    const publication = fixture();
    expect(isPublicationAuthorityCurrent(publication, now)).toBe(true);
    publication.supplierOffer.inventorySource.status = "degraded";
    expect(isPublicationAuthorityCurrent(publication, now)).toBe(true);
  });
  it("rejects expired rights, stale stock and revoked supplier capabilities independently", () => {
    const expired = fixture();
    if (expired.inventoryRightsGrant) {
      expired.inventoryRightsGrant.validUntil = now;
    }
    expect(isPublicationAuthorityCurrent(expired, now)).toBe(false);
    const stale = fixture();
    stale.supplierOffer.freshUntil = now;
    expect(isPublicationAuthorityCurrent(stale, now)).toBe(false);
    const missingCapability = fixture();
    missingCapability.supplierOffer.supplierOrg.capabilities = [];
    expect(isPublicationAuthorityCurrent(missingCapability, now)).toBe(false);
  });
  it("rejects rights for another source or market and future permissions", () => {
    const foreign = fixture();
    if (foreign.inventoryRightsGrant) {
      foreign.inventoryRightsGrant.inventorySourceId = "other-source";
    }
    expect(isPublicationAuthorityCurrent(foreign, now)).toBe(false);
    const futurePermission = fixture();
    if (futurePermission.marketPermission) {
      futurePermission.marketPermission.validFrom = future;
    }
    expect(isPublicationAuthorityCurrent(futurePermission, now)).toBe(false);
  });
  it("filters inquiry publications by destination, freshness and current authority", async () => {
    const revoked = fixture();
    revoked.supplierOffer.supplierOrg.deletedAt = past;
    const current = fixture();
    const findMany = vi.fn().mockResolvedValue([revoked, current]);
    const tx = {
      marketPublication: { findMany },
    } as unknown as Prisma.TransactionClient;
    await expect(
      findCurrentPublicMarketplacePublicationForInquiry(tx, {
        destinationCountryCode: "BG",
        supplierOfferId: "offer-a",
        now,
      })
    ).resolves.toBe(current);
    expect(findMany.mock.calls[0][0].where).toMatchObject({
      supplierOfferId: "offer-a",
      status: "published",
      freshUntil: { gt: now },
      market: { is: { countryCode: "BG", status: "active" } },
    });
    findMany.mockResolvedValue([revoked]);
    await expect(
      findCurrentPublicMarketplacePublicationForInquiry(tx, {
        destinationCountryCode: "BG",
        supplierOfferId: "offer-a",
        now,
      })
    ).resolves.toBeNull();
  });
});
