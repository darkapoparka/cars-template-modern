import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const transaction = {
    auditLog: { create: vi.fn() },
    moderationReport: { findFirst: vi.fn(), updateMany: vi.fn() },
  };

  return {
    redirect: vi.fn(),
    requireAuthorization: vi.fn(),
    revalidatePath: vi.fn(),
    transaction,
    withTransaction: vi.fn(
      (callback: (client: typeof transaction) => unknown) =>
        callback(transaction)
    ),
  };
});

vi.mock("@repo/database", () => ({
  database: { $transaction: mocks.withTransaction },
}));
vi.mock("../app/(authenticated)/admin/moderation/authorization", () => ({
  requireModerationAdminAuthorization: mocks.requireAuthorization,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { transitionModerationReportAction } from "../app/(authenticated)/admin/moderation/actions";

const transitionForm = (nextStatus: "dismissed" | "resolved" | "reviewing") => {
  const formData = new FormData();
  formData.set("nextStatus", nextStatus);
  formData.set("reportId", "report_123456");
  if (nextStatus === "dismissed") {
    formData.set("resolutionCode", "no_violation");
  } else if (nextStatus === "resolved") {
    formData.set("resolutionCode", "listing_corrected");
  }
  return formData;
};

describe("moderation admin transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue({
      accountId: "account_admin",
    });
    mocks.transaction.moderationReport.findFirst.mockResolvedValue({
      id: "report_123456",
      resolutionCode: null,
      status: "new",
    });
    mocks.transaction.moderationReport.updateMany.mockResolvedValue({
      count: 1,
    });
    mocks.transaction.auditLog.create.mockResolvedValue({ id: "audit_1" });
  });

  test("derives the admin actor server-side and records the transition", async () => {
    const formData = transitionForm("reviewing");
    formData.set("assignedAdminAccountId", "account_forged");

    await transitionModerationReportAction(formData);

    expect(mocks.transaction.moderationReport.updateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        assignedAdminAccountId: "account_admin",
        resolutionCode: null,
        resolvedAt: null,
        status: "reviewing",
      }),
      where: { id: "report_123456", status: "new" },
    });
    expect(mocks.transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "moderation.report.reviewing",
        actorAccountId: "account_admin",
        actorType: "admin",
      }),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/moderation");
    expect(mocks.redirect).toHaveBeenLastCalledWith("/admin/moderation");
  });

  test("fails closed when another reviewer changed the report", async () => {
    mocks.transaction.moderationReport.findFirst.mockResolvedValue(null);

    await transitionModerationReportAction(transitionForm("resolved"));

    expect(
      mocks.transaction.moderationReport.updateMany
    ).not.toHaveBeenCalled();
    expect(mocks.transaction.auditLog.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/admin/moderation?state=conflict"
    );
  });

  test.each([
    ["resolved", "listing_corrected"],
    ["dismissed", "no_violation"],
  ] as const)("records resolution data when a report is %s", async (nextStatus, resolutionCode) => {
    mocks.transaction.moderationReport.findFirst.mockResolvedValueOnce({
      id: "report_123456",
      resolutionCode: null,
      status: "reviewing",
    });

    await transitionModerationReportAction(transitionForm(nextStatus));

    expect(mocks.transaction.moderationReport.updateMany).toHaveBeenCalledWith({
      data: {
        assignedAdminAccountId: "account_admin",
        resolutionCode,
        resolvedAt: expect.any(Date),
        status: nextStatus,
      },
      where: { id: "report_123456", status: "reviewing" },
    });
    expect(mocks.transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: `moderation.report.${nextStatus}`,
        after: { resolutionCode, status: nextStatus },
        before: { resolutionCode: null, status: "reviewing" },
      }),
    });
  });

  test("requires a status-specific reason for every terminal transition", async () => {
    const missingReason = transitionForm("resolved");
    missingReason.delete("resolutionCode");

    await transitionModerationReportAction(missingReason);

    expect(mocks.withTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/admin/moderation?state=invalid_request"
    );

    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue({
      accountId: "account_admin",
    });
    const wrongReason = transitionForm("resolved");
    wrongReason.set("resolutionCode", "no_violation");

    await transitionModerationReportAction(wrongReason);

    expect(mocks.withTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/admin/moderation?state=invalid_request"
    );
  });

  test("does not audit when an optimistic update loses a race", async () => {
    mocks.transaction.moderationReport.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    await transitionModerationReportAction(transitionForm("resolved"));

    expect(mocks.transaction.auditLog.create).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/admin/moderation?state=conflict"
    );
  });

  test("rejects unsupported states before starting a transaction", async () => {
    const formData = new FormData();
    formData.set("nextStatus", "paused");
    formData.set("reportId", "report_123456");

    await transitionModerationReportAction(formData);

    expect(mocks.withTransaction).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/admin/moderation?state=invalid_request"
    );
  });
});
