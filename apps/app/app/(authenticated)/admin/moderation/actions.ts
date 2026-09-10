"use server";

import { database, type ModerationStatus } from "@repo/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireModerationAdminAuthorization } from "./authorization";
import {
  dismissedResolutionCodes,
  resolvedResolutionCodes,
} from "./moderation-transition-options";

const reportIdSchema = z.string().min(6).max(128);
const transitionSchema = z.discriminatedUnion("nextStatus", [
  z.object({
    nextStatus: z.literal("dismissed"),
    reportId: reportIdSchema,
    resolutionCode: z.enum(dismissedResolutionCodes),
  }),
  z.object({
    nextStatus: z.literal("resolved"),
    reportId: reportIdSchema,
    resolutionCode: z.enum(resolvedResolutionCodes),
  }),
  z.object({
    nextStatus: z.literal("reviewing"),
    reportId: reportIdSchema,
    resolutionCode: z.null(),
  }),
]);

const allowedPreviousStatuses: Readonly<
  Record<"dismissed" | "resolved" | "reviewing", readonly ModerationStatus[]>
> = {
  dismissed: ["new", "reviewing"],
  resolved: ["new", "reviewing"],
  reviewing: ["new"],
};

const moderationState = (state: string): never =>
  redirect(`/admin/moderation?state=${encodeURIComponent(state)}`);

export const transitionModerationReportAction = async (formData: FormData) => {
  const authorization = await requireModerationAdminAuthorization();
  const parsed = transitionSchema.safeParse({
    nextStatus: formData.get("nextStatus"),
    reportId: formData.get("reportId"),
    resolutionCode: formData.get("resolutionCode"),
  });

  if (!parsed.success) {
    return moderationState("invalid_request");
  }

  const { nextStatus, reportId, resolutionCode } = parsed.data;
  const now = new Date();
  const result = await database.$transaction(async (transaction) => {
    const current = await transaction.moderationReport.findFirst({
      select: { id: true, resolutionCode: true, status: true },
      where: {
        id: reportId,
        status: { in: [...allowedPreviousStatuses[nextStatus]] },
      },
    });

    if (!current) {
      return "conflict" as const;
    }

    const update = await transaction.moderationReport.updateMany({
      data: {
        assignedAdminAccountId: authorization.accountId,
        resolutionCode,
        resolvedAt: nextStatus === "reviewing" ? null : now,
        status: nextStatus,
      },
      where: {
        id: current.id,
        status: current.status,
      },
    });

    if (update.count !== 1) {
      return "conflict" as const;
    }

    await transaction.auditLog.create({
      data: {
        action: `moderation.report.${nextStatus}`,
        actorAccountId: authorization.accountId,
        actorType: "admin",
        after: { resolutionCode, status: nextStatus },
        before: {
          resolutionCode: current.resolutionCode,
          status: current.status,
        },
        entityId: current.id,
        entityType: "moderation_report",
      },
    });

    return "updated" as const;
  });

  if (result === "conflict") {
    return moderationState(result);
  }

  revalidatePath("/admin/moderation");
  return redirect("/admin/moderation");
};
