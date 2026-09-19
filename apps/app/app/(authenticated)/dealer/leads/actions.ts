"use server";

import {
  DealerLeadConflictError,
  updateDealerLead,
} from "@repo/database/dealer-leads";
import { dealerLeadChangeSchema } from "@repo/marketplace/lead-workflow";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDealerOrganizationActor } from "../actor";

export const updateDealerLeadAction = async (
  formData: FormData
): Promise<never> => {
  // Re-authenticate in every action; layout authentication is not action authorization.
  const actor = await requireDealerOrganizationActor([
    "owner",
    "manager",
    "sales",
  ]);
  const parsed = dealerLeadChangeSchema.safeParse({
    leadId: formData.get("leadId"),
    expectedUpdatedAt: formData.get("expectedUpdatedAt"),
    status: formData.get("status"),
    assignedMemberId: formData.get("assignedMemberId") || null,
  });
  if (!parsed.success) {
    redirect("/dealer/leads?state=invalid");
  }
  const detailPath = `/dealer/leads/${encodeURIComponent(parsed.data.leadId)}`;
  let state = "saved";
  try {
    await updateDealerLead(actor, parsed.data);
  } catch (error) {
    state =
      error instanceof DealerLeadConflictError ? "conflict" : "unavailable";
  }
  if (state === "saved") {
    revalidatePath("/dealer/leads");
    revalidatePath(detailPath);
  }
  redirect(`${detailPath}?state=${state}`);
};
