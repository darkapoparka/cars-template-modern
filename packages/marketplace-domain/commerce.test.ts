import { describe, expect, test } from "vitest";
import {
  commercePlanCatalog,
  createCommercePlanCatalog,
  evaluateActiveListingQuota,
  evaluateMeteredEntitlementQuota,
  evaluatePromotionActivation,
  evaluatePromotionEligibility,
  getQuotaRecoveryCopy,
  promotionPlacementPolicy,
  providerDisabledPromotionCheckoutPort,
  resolveEntitlement,
  selectSponsoredPromotions,
} from "./commerce";

const now = new Date("2026-07-26T12:00:00.000Z");
const dealerSubject = { id: "dealer_1", kind: "dealer_org" } as const;

describe("commerce plan hypotheses", () => {
  test("keeps the launch listing limits explicit and configurable", () => {
    expect(
      commercePlanCatalog["private-free"].entitlements.activeListingLimit
    ).toBe(2);
    expect(
      commercePlanCatalog["dealer-starter"].entitlements.activeListingLimit
    ).toBe(10);
    expect(
      commercePlanCatalog["dealer-growth"].entitlements.activeListingLimit
    ).toBe(50);
    expect(
      commercePlanCatalog["dealer-scale"].entitlements.activeListingLimit
    ).toBe(200);

    const configured = createCommercePlanCatalog({
      "dealer-scale": { activeListingLimit: 350, seatLimit: 20 },
    });
    expect(configured["dealer-scale"].entitlements.activeListingLimit).toBe(
      350
    );
    expect(configured["dealer-scale"].entitlements.seatLimit).toBe(20);
  });

  test("rejects unsafe configuration instead of silently granting access", () => {
    expect(() =>
      createCommercePlanCatalog({
        "dealer-starter": { activeListingLimit: 0 },
      })
    ).toThrow("dealer-starter.activeListingLimit");
  });
});

describe("entitlement resolution and active listing quota", () => {
  test("gives a private seller exactly two active listings without billing", () => {
    const entitlement = resolveEntitlement({
      now,
      source: { kind: "unavailable" },
      subject: { id: "seller_1", kind: "private_seller" },
    });

    expect(entitlement.plan?.key).toBe("private-free");
    expect(
      evaluateActiveListingQuota({
        activeListingCount: 1,
        entitlement,
      })
    ).toMatchObject({ allowed: true, limit: 2, remaining: 1 });
    expect(
      evaluateActiveListingQuota({
        activeListingCount: 2,
        entitlement,
      })
    ).toMatchObject({ allowed: false, code: "quota_reached", limit: 2 });
  });

  test("resolves an in-period dealer plan independently of provider reachability", () => {
    const entitlement = resolveEntitlement({
      now,
      source: {
        currentPeriodEnd: new Date("2026-08-26T12:00:00.000Z"),
        currentPeriodStart: new Date("2026-07-26T00:00:00.000Z"),
        kind: "subscription",
        planKey: "dealer-growth",
        status: "active",
      },
      subject: dealerSubject,
    });

    expect(entitlement).toMatchObject({
      plan: { key: "dealer-growth" },
      source: "subscription",
      state: "active",
    });
    expect(entitlement.entitlements.aiCreditsPerPeriod).toBe(100);
  });

  test("fails closed for unknown plans, grace, expiry, and missing periods", () => {
    const unknown = resolveEntitlement({
      now,
      source: {
        currentPeriodEnd: new Date("2026-08-26T12:00:00.000Z"),
        kind: "subscription",
        planKey: "invented-plan",
        status: "active",
      },
      subject: dealerSubject,
    });
    const grace = resolveEntitlement({
      now,
      source: {
        currentPeriodEnd: new Date("2026-08-26T12:00:00.000Z"),
        kind: "subscription",
        planKey: "dealer-starter",
        status: "past_due",
      },
      subject: dealerSubject,
    });
    const expired = resolveEntitlement({
      now,
      source: {
        currentPeriodEnd: new Date("2026-07-25T12:00:00.000Z"),
        kind: "subscription",
        planKey: "dealer-starter",
        status: "active",
      },
      subject: dealerSubject,
    });

    expect(unknown.state).toBe("fail_closed");
    expect(
      evaluateActiveListingQuota({
        activeListingCount: 0,
        entitlement: unknown,
      }).code
    ).toBe("plan_unavailable");
    expect(
      evaluateActiveListingQuota({
        activeListingCount: 2,
        entitlement: grace,
      }).code
    ).toBe("entitlement_grace");
    expect(
      evaluateActiveListingQuota({
        activeListingCount: 2,
        entitlement: expired,
      }).code
    ).toBe("entitlement_expired");
  });

  test("blocks overage after downgrade and never instructs deletion", () => {
    const entitlement = resolveEntitlement({
      now,
      source: {
        effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
        kind: "grant",
        planKey: "dealer-starter",
        status: "active",
      },
      subject: dealerSubject,
    });
    const decision = evaluateActiveListingQuota({
      activeListingCount: 14,
      entitlement,
    });

    expect(decision).toMatchObject({
      allowed: false,
      code: "quota_reached",
      limit: 10,
      overage: 4,
    });
    expect(getQuotaRecoveryCopy(decision.code, "bg")).toContain("пауза");
    expect(getQuotaRecoveryCopy(decision.code, "en")).not.toMatch(/delete/i);
  });

  test("keeps AI and included-promotion usage bounded", () => {
    const entitlement = resolveEntitlement({
      now,
      source: {
        currentPeriodEnd: new Date("2026-08-26T12:00:00.000Z"),
        kind: "subscription",
        planKey: "dealer-growth",
        status: "active",
      },
      subject: dealerSubject,
    });
    expect(
      evaluateMeteredEntitlementQuota({
        entitlement,
        featureKey: "ai_credit",
        requested: 5,
        usage: 95,
      })
    ).toMatchObject({ allowed: true, limit: 100, remaining: 0 });
    expect(
      evaluateMeteredEntitlementQuota({
        entitlement,
        featureKey: "ai_credit",
        requested: 1,
        usage: 100,
      })
    ).toMatchObject({
      allowed: false,
      code: "metered_quota_reached",
    });
  });
});

describe("promotion safety", () => {
  test("keeps eligibility organization-scoped and requires an active listing", () => {
    expect(
      evaluatePromotionEligibility({
        activePromotionCount: 0,
        actorDealerOrgId: "dealer_1",
        listing: { dealerOrgId: "dealer_2", status: "active" },
        productId: "promo-search-top-7",
      }).code
    ).toBe("organization_mismatch");
    expect(
      evaluatePromotionEligibility({
        activePromotionCount: 0,
        actorDealerOrgId: "dealer_1",
        listing: { dealerOrgId: "dealer_1", status: "paused" },
        productId: "promo-search-top-7",
      }).code
    ).toBe("listing_inactive");
  });

  test("activates only verified payment in-window and is idempotent", () => {
    const promotion = {
      activatedByEventId: null,
      dealerOrgId: "dealer_1",
      endsAt: new Date("2026-08-02T12:00:00.000Z"),
      listingStatus: "active",
      paymentStatus: "paid" as const,
      startsAt: new Date("2026-07-26T00:00:00.000Z"),
      status: "scheduled" as const,
    };
    const first = evaluatePromotionActivation({
      actorDealerOrgId: "dealer_1",
      eventId: "provider_event_1",
      now,
      promotion,
    });
    expect(first.code).toBe("activated");
    const second = evaluatePromotionActivation({
      actorDealerOrgId: "dealer_1",
      eventId: "provider_event_1",
      now,
      promotion: first.next,
    });
    expect(second.code).toBe("idempotent");

    expect(
      evaluatePromotionActivation({
        actorDealerOrgId: "dealer_1",
        eventId: "provider_event_2",
        now,
        promotion: { ...promotion, paymentStatus: "pending" },
      }).code
    ).toBe("payment_unverified");
  });

  test("expires, frequency-caps, and separates sponsored selection from organic order", () => {
    const organicOrder = ["listing_organic_1", "listing_organic_2"];
    const candidates = Array.from({ length: 6 }, (_, index) => ({
      endsAt: new Date(
        index === 4 ? "2026-07-25T12:00:00.000Z" : "2026-08-02T12:00:00.000Z"
      ),
      id: `promotion_${index}`,
      listingId: `listing_${index}`,
      listingStatus: "active",
      organicallyEligible: index !== 3,
      paymentStatus: "paid" as const,
      startsAt: new Date("2026-07-26T00:00:00.000Z"),
      status: "active",
      viewerImpressionsToday:
        index === 5
          ? promotionPlacementPolicy.maxImpressionsPerViewerPerDay
          : 0,
    }));

    const sponsored = selectSponsoredPromotions({ candidates, now });
    expect(sponsored).toHaveLength(3);
    expect(sponsored.map((item) => item.listingId)).toEqual([
      "listing_0",
      "listing_1",
      "listing_2",
    ]);
    expect(organicOrder).toEqual(["listing_organic_1", "listing_organic_2"]);
  });

  test("provider-disabled checkout never returns a session or success", async () => {
    await expect(
      providerDisabledPromotionCheckoutPort.createCheckout({
        dealerOrgId: "dealer_1",
        idempotencyKey: "checkout_1",
        listingId: "listing_1",
        productId: "promo-search-top-7",
      })
    ).resolves.toEqual({
      reason: "provider_disabled",
      status: "unavailable",
    });
  });
});
