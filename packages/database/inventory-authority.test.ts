import { requiredSupplierCapabilities } from "@repo/marketplace-domain";
import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "./generated/client";
import { findCurrentPublicMarketplacePublicationForInquiry } from "./inventory-ingestion";

const now = new Date("2026-07-12T20:00:00.000Z");
const earlier = new Date("2026-07-11T20:00:00.000Z");
const later = new Date("2026-07-13T20:00:00.000Z");

const getCurrentPublication = () => ({
  channel: "public_marketplace",
  eligibilityDecision: "eligible",
  eligibilityExpiresAt: later,
  freshUntil: later,
  inventoryRightsGrant: {
    inventorySourceId: "source-1",
    marketId: "market-bg",
    status: "active",
    validFrom: earlier,
    validUntil: later,
  },
  market: { countryCode: "BG", status: "active" },
  marketId: "market-bg",
  marketPermission: {
    status: "active",
    validFrom: earlier,
    validUntil: later,
  },
  status: "published",
  supplierOffer: {
    freshUntil: later,
    inventorySource: {
      deletedAt: null,
      mediaRightsStatus: "active",
      status: "active",
    },
    inventorySourceId: "source-1",
    status: "available",
    supplierOrg: {
      capabilities: requiredSupplierCapabilities.map((capabilityKey) => ({
        capabilityKey,
        expiresAt: later,
        status: "active",
      })),
      deletedAt: null,
      kybExpiresAt: later,
      kybStatus: "verified",
      onboardingStatus: "approved",
      supplierTrust: [{ expiresAt: later, status: "verified" }],
    },
  },
});

const getTransaction = (publications: unknown[]) => {
  const findMany = vi.fn().mockResolvedValue(publications);
  const tx = {
    marketPublication: { findMany },
  } as unknown as Prisma.TransactionClient;

  return { findMany, tx };
};

describe("public inquiry publication authority", () => {
  it("selects the exact current destination publication", async () => {
    const publication = getCurrentPublication();
    const { findMany, tx } = getTransaction([publication]);

    await expect(
      findCurrentPublicMarketplacePublicationForInquiry(tx, {
        destinationCountryCode: "BG",
        now,
        supplierOfferId: "offer-1",
      })
    ).resolves.toBe(publication);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          channel: "public_marketplace",
          eligibilityDecision: "eligible",
          freshUntil: { gt: now },
          status: "published",
          supplierOfferId: "offer-1",
        }),
      })
    );
  });

  it("fails closed when a required supplier authority is revoked", async () => {
    const publication = getCurrentPublication();
    const capability = publication.supplierOffer.supplierOrg.capabilities[0];
    if (!capability) {
      throw new Error("Expected a required capability in the fixture");
    }
    capability.status = "suspended";
    const { tx } = getTransaction([publication]);

    await expect(
      findCurrentPublicMarketplacePublicationForInquiry(tx, {
        destinationCountryCode: "BG",
        now,
        supplierOfferId: "offer-1",
      })
    ).resolves.toBeNull();
  });
});
