import { z } from "zod";

export const dealerLeadStatuses = [
  "new",
  "viewed",
  "contacted",
  "qualified",
  "won",
  "lost",
  "closed",
  "spam",
] as const;
export type DealerLeadStatus = (typeof dealerLeadStatuses)[number];
export type DealerLeadRole = "owner" | "manager" | "sales" | "viewer";
export const dealerLeadStatusSchema = z.enum(dealerLeadStatuses);
export const dealerLeadQuerySchema = z.object({
  cursor: z.string().max(128).optional(),
  status: dealerLeadStatusSchema.optional(),
  q: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});
export type DealerLeadQuery = z.infer<typeof dealerLeadQuerySchema>;
export const dealerLeadChangeSchema = z.object({
  leadId: z.string().min(1).max(128),
  expectedUpdatedAt: z.iso.datetime(),
  status: dealerLeadStatusSchema,
  assignedMemberId: z.string().max(128).nullable(),
});
export type DealerLeadChange = z.infer<typeof dealerLeadChangeSchema>;

const terminalStatuses = new Set<DealerLeadStatus>([
  "won",
  "lost",
  "closed",
  "spam",
]);
export const canReadLeadContacts = (role: DealerLeadRole): boolean =>
  role === "owner" || role === "manager" || role === "sales";
export const canAssignDealerLeads = (role: DealerLeadRole): boolean =>
  role === "owner" || role === "manager";
export const canChangeDealerLead = ({
  role,
  memberId,
  currentAssigneeId,
  nextAssigneeId,
  currentStatus,
  nextStatus,
}: {
  role: DealerLeadRole;
  memberId: string;
  currentAssigneeId: string | null;
  nextAssigneeId: string | null;
  currentStatus: DealerLeadStatus;
  nextStatus: DealerLeadStatus;
}): boolean => {
  if (canAssignDealerLeads(role)) {
    return true;
  }
  if (role !== "sales") {
    return false;
  }
  if (currentAssigneeId && currentAssigneeId !== memberId) {
    return false;
  }
  if (nextAssigneeId !== null && nextAssigneeId !== memberId) {
    return false;
  }
  if (terminalStatuses.has(currentStatus) && currentStatus !== nextStatus) {
    return false;
  }
  return true;
};
