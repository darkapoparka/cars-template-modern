import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  countListings: vi.fn(),
  createUsage: vi.fn(),
  findBillingAccount: vi.fn(),
  findGrant: vi.fn(),
  findUsage: vi.fn(),
  sumUsage: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("./index", () => ({
  database: {
    $transaction: mocks.transaction,
    dealerBillingAccount: { findUnique: mocks.findBillingAccount },
    entitlementGrant: { findFirst: mocks.findGrant },
    entitlementUsageEvent: {
      aggregate: mocks.sumUsage,
      create: mocks.createUsage,
      findUnique: mocks.findUsage,
    },
    marketplaceListing: { count: mocks.countListings },
  },
}));

import {
  ActiveListingQuotaError,
  assertActiveListingQuota,
  getActiveListingQuotaView,
  getCommerceEntitlement,
  MeteredEntitlementQuotaError,
  recordEntitlementUsage,
  reserveEntitlementUsage,
} from "./commerce";

const now = new Date("2026-07-26T12:00:00.000Z");
const dealerSubject = { id: "dealer_1", kind: "dealer_org" } as const;

describe("durable commerce entitlement resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findGrant.mockResolvedValue(null);
    mocks.findBillingAccount.mockResolvedValue(null);
    mocks.countListings.mockResolvedValue(0);
    mocks.findUsage.mockResolvedValue(null);
    mocks.createUsage.mockResolvedValue({ id: "usage_1" });
    mocks.sumUsage.mockResolvedValue({ _sum: { delta: 0 } });
    mocks.transaction.mockImplementation(
      async (work: (client: unknown) => Promise<unknown>) =>
        work({
          dealerBillingAccount: { findUnique: mocks.findBillingAccount },
          entitlementGrant: { findFirst: mocks.findGrant },
          entitlementUsageEvent: {
            aggregate: mocks.sumUsage,
            create: mocks.createUsage,
            findUnique: mocks.findUsage,
          },
          marketplaceListing: { count: mocks.countListings },
        })
    );
  });

  test("scopes grant, subscription, and quota reads to one organization", async () => {
    mocks.findGrant.mockResolvedValue({
      effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
      effectiveUntil: new Date("2026-08-01T00:00:00.000Z"),
      entitlementsSnapshot: {
        activeListingLimit: 10,
        aiCreditsPerPeriod: 0,
        aiCreditPeriod: "month",
        analytics: "basic",
        apiAccess: false,
        bulkImport: false,
        feedAccess: false,
        includedPromotionCreditsPerPeriod: 0,
        includedPromotionPeriod: "month",
        locationLimit: 1,
        negotiatedCapacityAvailable: false,
        publicProfile: "basic",
        seatLimit: 1,
        slaReady: false,
      },
      graceUntil: null,
      planKey: "dealer-starter",
      status: "active",
    });
    mocks.countListings.mockResolvedValue(8);

    const view = await getActiveListingQuotaView(dealerSubject, now);

    expect(mocks.findGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dealerOrgId: "dealer_1" }),
      })
    );
    expect(mocks.findBillingAccount).not.toHaveBeenCalled();
    expect(mocks.countListings).toHaveBeenCalledWith({
      where: {
        dealerOrgId: "dealer_1",
        deletedAt: null,
        status: "active",
      },
    });
    expect(view.decision).toMatchObject({
      allowed: true,
      limit: 10,
      remaining: 2,
    });
  });

  test("fails closed when a durable snapshot is malformed", async () => {
    mocks.findGrant.mockResolvedValue({
      effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
      effectiveUntil: new Date("2026-08-01T00:00:00.000Z"),
      entitlementsSnapshot: { activeListingLimit: 10 },
      graceUntil: null,
      planKey: "dealer-starter",
      status: "active",
    });

    const entitlement = await getCommerceEntitlement(dealerSubject, now);
    expect(entitlement.state).toBe("fail_closed");
    expect(entitlement.entitlements.activeListingLimit).toBe(0);
  });

  test("uses an eligible durable subscription when no grant exists", async () => {
    mocks.findBillingAccount.mockResolvedValue({
      subscriptions: [
        {
          currentPeriodEnd: new Date("2026-08-26T12:00:00.000Z"),
          currentPeriodStart: new Date("2026-07-26T00:00:00.000Z"),
          entitlementsSnapshot: null,
          planKey: "dealer-growth",
          status: "active",
          trialEnd: null,
        },
      ],
    });

    const entitlement = await getCommerceEntitlement(dealerSubject, now);
    expect(entitlement).toMatchObject({
      plan: { key: "dealer-growth" },
      source: "subscription",
      state: "active",
    });
  });

  test("blocks activation over quota without mutating inventory", async () => {
    mocks.findGrant.mockResolvedValue({
      effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
      effectiveUntil: new Date("2026-08-01T00:00:00.000Z"),
      entitlementsSnapshot: {
        activeListingLimit: 10,
        aiCreditsPerPeriod: 0,
        aiCreditPeriod: "month",
        analytics: "basic",
        apiAccess: false,
        bulkImport: false,
        feedAccess: false,
        includedPromotionCreditsPerPeriod: 0,
        includedPromotionPeriod: "month",
        locationLimit: 1,
        negotiatedCapacityAvailable: false,
        publicProfile: "basic",
        seatLimit: 1,
        slaReady: false,
      },
      graceUntil: null,
      planKey: "dealer-starter",
      status: "active",
    });
    mocks.countListings.mockResolvedValue(10);
    const client = {
      dealerBillingAccount: { findUnique: mocks.findBillingAccount },
      entitlementGrant: { findFirst: mocks.findGrant },
      marketplaceListing: { count: mocks.countListings },
    };

    await expect(
      assertActiveListingQuota({
        client: client as never,
        now,
        subject: dealerSubject,
      })
    ).rejects.toBeInstanceOf(ActiveListingQuotaError);
  });

  test("records usage idempotently and rejects key reuse across organizations", async () => {
    const input = {
      actorAccountId: "account_1",
      delta: 1,
      featureKey: "active_listing",
      idempotencyKey: "listing:1:active:v1",
      periodEnd: new Date("2026-08-01T00:00:00.000Z"),
      periodStart: new Date("2026-07-01T00:00:00.000Z"),
      sourceEntityId: "listing_1",
      sourceEntityType: "listing",
      subject: dealerSubject,
    };
    expect(await recordEntitlementUsage(input)).toBe("created");
    expect(mocks.createUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dealerOrgId: "dealer_1" }),
      })
    );

    mocks.findUsage.mockResolvedValue({
      dealerOrgId: "dealer_2",
      delta: 1,
      featureKey: "active_listing",
      periodEnd: input.periodEnd,
      periodStart: input.periodStart,
      sellerProfileId: null,
      sourceEntityId: "listing_1",
      sourceEntityType: "listing",
    });
    await expect(recordEntitlementUsage(input)).rejects.toThrow(
      "Entitlement usage idempotency conflict"
    );
  });

  test("serializes bounded AI usage and rejects over-quota reservations", async () => {
    mocks.findBillingAccount.mockResolvedValue({
      subscriptions: [
        {
          currentPeriodEnd: new Date("2026-08-26T12:00:00.000Z"),
          currentPeriodStart: new Date("2026-07-26T00:00:00.000Z"),
          entitlementsSnapshot: null,
          planKey: "dealer-growth",
          status: "active",
          trialEnd: null,
        },
      ],
    });
    mocks.sumUsage.mockResolvedValueOnce({ _sum: { delta: 95 } });

    await expect(
      reserveEntitlementUsage({
        actorAccountId: "account_1",
        featureKey: "ai_credit",
        idempotencyKey: "ai:listing_1:v1",
        now,
        quantity: 5,
        sourceEntityId: "listing_1",
        sourceEntityType: "listing_copy",
        subject: dealerSubject,
      })
    ).resolves.toMatchObject({
      decision: { allowed: true, limit: 100, remaining: 0 },
      status: "created",
    });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });

    mocks.sumUsage.mockResolvedValueOnce({ _sum: { delta: 100 } });
    await expect(
      reserveEntitlementUsage({
        featureKey: "ai_credit",
        idempotencyKey: "ai:listing_2:v1",
        now,
        quantity: 1,
        subject: dealerSubject,
      })
    ).rejects.toBeInstanceOf(MeteredEntitlementQuotaError);
  });
});
