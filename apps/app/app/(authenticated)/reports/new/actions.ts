"use server";

import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { getOrCreateActiveMarketplaceAccount } from "@repo/database/accounts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBuyerReportOption } from "./report-options";

const DETAILS_MIN_LENGTH = 10;
const DETAILS_MAX_LENGTH = 2000;
const REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;
const REPORT_LIMIT_PER_WINDOW = 20;

const getFormValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getReportHref = (
  listingId: string,
  result:
    | "account-unavailable"
    | "invalid"
    | "listing-unavailable"
    | "rate-limited"
) => {
  const searchParams = new URLSearchParams({ listing: listingId });
  searchParams.set("error", result);

  return `/reports/new?${searchParams.toString()}`;
};

const getSubmittedReportHref = (listingId: string, reportId: string) => {
  const searchParams = new URLSearchParams({
    listing: listingId,
    submitted: reportId,
  });

  return `/reports/new?${searchParams.toString()}`;
};

export const createModerationReportAction = async (formData: FormData) => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const listingId = getFormValue(formData, "listingId");
  const details = getFormValue(formData, "details");
  const reportOption = getBuyerReportOption(getFormValue(formData, "reason"));

  if (
    !(listingId && reportOption) ||
    details.length < DETAILS_MIN_LENGTH ||
    details.length > DETAILS_MAX_LENGTH
  ) {
    return redirect(getReportHref(listingId, "invalid"));
  }

  const result = await database.$transaction(async (transaction) => {
    const listing = await transaction.marketplaceListing.findFirst({
      select: {
        id: true,
        sellerId: true,
        title: true,
      },
      where: {
        deletedAt: null,
        id: listingId,
        status: "active",
      },
    });

    if (!listing) {
      return "listing-unavailable" as const;
    }

    const account = await getOrCreateActiveMarketplaceAccount(
      session.userId,
      transaction
    );

    if (!account) {
      return "account-unavailable" as const;
    }

    const windowStart = new Date(Date.now() - REPORT_WINDOW_MS);
    const lockKey = `moderation-report-account:${account.id}`;
    await transaction.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text AS lock_result
    `;
    const duplicate = await transaction.moderationReport.findFirst({
      select: { id: true },
      where: {
        createdAt: { gte: windowStart },
        listingId: listing.id,
        reason: reportOption.value,
        reporterAccountId: account.id,
        status: { in: ["new", "reviewing"] },
      },
    });

    if (duplicate) {
      return { reportId: duplicate.id, result: "submitted" } as const;
    }

    const reportsInWindow = await transaction.moderationReport.count({
      where: {
        createdAt: { gte: windowStart },
        reporterAccountId: account.id,
      },
    });

    if (reportsInWindow >= REPORT_LIMIT_PER_WINDOW) {
      return "rate-limited" as const;
    }

    const report = await transaction.moderationReport.create({
      data: {
        details,
        listingId: listing.id,
        listingTitleSnapshot: listing.title,
        reason: reportOption.value,
        reporterAccountId: account.id,
        sellerIdSnapshot: listing.sellerId,
        severity: reportOption.severity,
        source: "buyer_report",
      },
      select: { id: true },
    });

    await transaction.auditLog.create({
      data: {
        action: "moderation.report.created",
        actorAccountId: account.id,
        actorType: "account",
        entityId: report.id,
        entityType: "moderation_report",
      },
    });

    return { reportId: report.id, result: "submitted" } as const;
  });

  if (typeof result === "string") {
    return redirect(getReportHref(listingId, result));
  }

  revalidatePath("/admin/moderation");
  return redirect(getSubmittedReportHref(listingId, result.reportId));
};
