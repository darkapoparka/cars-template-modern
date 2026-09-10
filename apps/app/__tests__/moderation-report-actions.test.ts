import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const transaction = {
    $queryRaw: vi.fn(),
    auditLog: { create: vi.fn() },
    marketplaceListing: { findFirst: vi.fn() },
    moderationReport: { count: vi.fn(), create: vi.fn(), findFirst: vi.fn() },
  };

  return {
    auth: vi.fn(),
    getOrCreateActiveMarketplaceAccount: vi.fn(),
    redirect: vi.fn(),
    revalidatePath: vi.fn(),
    transaction,
    withTransaction: vi.fn(
      (callback: (client: typeof transaction) => unknown) =>
        callback(transaction)
    ),
  };
});

vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("@repo/database", () => ({
  database: { $transaction: mocks.withTransaction },
}));
vi.mock("@repo/database/accounts", () => ({
  getOrCreateActiveMarketplaceAccount:
    mocks.getOrCreateActiveMarketplaceAccount,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { createModerationReportAction } from "../app/(authenticated)/reports/new/actions";

const validForm = () => {
  const formData = new FormData();
  formData.set("details", "Продавачът поиска плащане извън платформата.");
  formData.set("listingId", "listing_1");
  formData.set("reason", "fraud_risk");
  return formData;
};

describe("buyer moderation report action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      redirectToSignIn: vi.fn(),
      userId: "user_1",
    });
    mocks.getOrCreateActiveMarketplaceAccount.mockResolvedValue({
      id: "account_1",
    });
    mocks.transaction.$queryRaw.mockResolvedValue([{ lock_result: "" }]);
    mocks.transaction.marketplaceListing.findFirst.mockResolvedValue({
      id: "listing_1",
      sellerId: "seller_1",
      title: "Volvo XC60",
    });
    mocks.transaction.moderationReport.findFirst.mockResolvedValue(null);
    mocks.transaction.moderationReport.count.mockResolvedValue(0);
    mocks.transaction.moderationReport.create.mockResolvedValue({
      id: "report_1",
    });
    mocks.transaction.auditLog.create.mockResolvedValue({ id: "audit_1" });
  });

  test("persists a validated report and its audit event", async () => {
    await createModerationReportAction(validForm());

    expect(mocks.transaction.moderationReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: "Продавачът поиска плащане извън платформата.",
        listingId: "listing_1",
        listingTitleSnapshot: "Volvo XC60",
        reason: "fraud_risk",
        reporterAccountId: "account_1",
        sellerIdSnapshot: "seller_1",
        severity: "high",
        source: "buyer_report",
      }),
      select: { id: true },
    });
    expect(mocks.transaction.$queryRaw).toHaveBeenCalledOnce();
    expect(
      mocks.transaction.$queryRaw.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mocks.transaction.moderationReport.findFirst.mock.invocationCallOrder[0]
    );
    expect(mocks.transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "moderation.report.created",
        actorAccountId: "account_1",
        entityId: "report_1",
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/moderation");
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/reports/new?listing=listing_1&submitted=report_1"
    );
  });

  test("rejects malformed input before opening a transaction", async () => {
    const formData = validForm();
    formData.set("details", "Кратко");

    await createModerationReportAction(formData);

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/reports/new?listing=listing_1&error=invalid"
    );
    expect(mocks.withTransaction).not.toHaveBeenCalled();
  });

  test("treats a recent matching open report as submitted", async () => {
    mocks.transaction.moderationReport.findFirst.mockResolvedValue({
      id: "report_existing",
    });

    await createModerationReportAction(validForm());

    expect(mocks.transaction.moderationReport.create).not.toHaveBeenCalled();
    expect(mocks.transaction.moderationReport.count).not.toHaveBeenCalled();
    expect(mocks.transaction.auditLog.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/reports/new?listing=listing_1&submitted=report_existing"
    );
  });

  test("fails closed without reactivating a disabled durable account", async () => {
    mocks.getOrCreateActiveMarketplaceAccount.mockResolvedValueOnce(null);

    await createModerationReportAction(validForm());

    expect(mocks.transaction.$queryRaw).not.toHaveBeenCalled();
    expect(mocks.transaction.moderationReport.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/reports/new?listing=listing_1&error=account-unavailable"
    );
  });

  test("limits unique reports per active account in a rolling window", async () => {
    mocks.transaction.moderationReport.count.mockResolvedValueOnce(20);

    await createModerationReportAction(validForm());

    expect(mocks.transaction.moderationReport.create).not.toHaveBeenCalled();
    expect(mocks.transaction.auditLog.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/reports/new?listing=listing_1&error=rate-limited"
    );
  });

  test("does not access report data before an unauthenticated caller is redirected", async () => {
    const redirectToSignIn = vi.fn();
    mocks.auth.mockResolvedValueOnce({
      redirectToSignIn,
      userId: null,
    });

    await createModerationReportAction(validForm());

    expect(redirectToSignIn).toHaveBeenCalledOnce();
    expect(mocks.withTransaction).not.toHaveBeenCalled();
  });

  test("fails closed when the listing is no longer active", async () => {
    mocks.transaction.marketplaceListing.findFirst.mockResolvedValue(null);

    await createModerationReportAction(validForm());

    expect(mocks.getOrCreateActiveMarketplaceAccount).not.toHaveBeenCalled();
    expect(mocks.transaction.moderationReport.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/reports/new?listing=listing_1&error=listing-unavailable"
    );
  });
});
