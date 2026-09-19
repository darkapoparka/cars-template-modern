import "server-only";
import {
  canAssignDealerLeads,
  canChangeDealerLead,
  canReadLeadContacts,
  type DealerLeadChange,
  type DealerLeadQuery,
  dealerLeadChangeSchema,
  dealerLeadQuerySchema,
} from "@repo/marketplace-domain/lead-workflow";
import type { Prisma, PrismaClient } from "./generated/client";
import { database } from "./index";
import {
  type DurableOrganizationActor,
  OrganizationAuthorizationError,
} from "./organization-access";

type LeadClient = PrismaClient | Prisma.TransactionClient;
export class DealerLeadConflictError extends Error {}

const requireLeadMember = async (
  actor: DurableOrganizationActor,
  client: LeadClient
) => {
  const member = await client.dealerMember.findFirst({
    select: { id: true, role: true },
    where: {
      accountId: actor.accountId,
      dealerOrgId: actor.dealerOrgId,
      clerkDeletedAt: null,
      disabledAt: null,
      status: "active",
      account: { deletedAt: null, status: "active" },
      dealerOrg: { clerkDeletedAt: null, deletedAt: null },
    },
  });
  if (!member) {
    throw new OrganizationAuthorizationError(
      "Active dealer membership required"
    );
  }
  return member;
};

const leadScope = (
  dealerOrgId: string,
  member: { id: string; role: string }
): Prisma.LeadWhereInput => ({
  dealerOrgId,
  deletedAt: null,
  ...(member.role === "sales"
    ? {
        OR: [
          { assignedDealerMemberId: member.id },
          { assignedDealerMemberId: null },
        ],
      }
    : {}),
});

const leadSelect = {
  id: true,
  buyerName: true,
  phone: true,
  email: true,
  message: true,
  status: true,
  intent: true,
  source: true,
  channel: true,
  assignedDealerMemberId: true,
  createdAt: true,
  updatedAt: true,
  firstViewedAt: true,
  respondedAt: true,
  closedAt: true,
  listing: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.LeadSelect;
type LeadRecord = Prisma.LeadGetPayload<{ select: typeof leadSelect }>;
const toLeadView = (lead: LeadRecord, contacts: boolean) => ({
  ...lead,
  buyerName: contacts ? lead.buyerName : null,
  phone: contacts ? lead.phone : null,
  email: contacts ? lead.email : null,
  message: contacts ? lead.message : null,
});

export const getDealerLeadPage = async (
  actor: DurableOrganizationActor,
  input: Partial<DealerLeadQuery> = {},
  client: LeadClient = database
) => {
  const query = dealerLeadQuerySchema.parse(input);
  const member = await requireLeadMember(actor, client);
  const contactsVisible = canReadLeadContacts(member.role);
  const scope = leadScope(actor.dealerOrgId, member);
  const cursor = query.cursor
    ? await client.lead.findFirst({
        select: { id: true, createdAt: true },
        where: { AND: [scope, { id: query.cursor }] },
      })
    : null;
  if (query.cursor && !cursor) {
    throw new DealerLeadConflictError(
      "Pagination cursor is no longer available"
    );
  }
  const conditions: Prisma.LeadWhereInput[] = [scope];
  if (query.status) {
    conditions.push({ status: query.status });
  }
  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" as const };
    conditions.push({
      OR: [
        { listing: { title: contains } },
        ...(contactsVisible
          ? [{ buyerName: contains }, { email: contains }, { phone: contains }]
          : []),
      ],
    });
  }
  if (cursor) {
    conditions.push({
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    });
  }
  const rows = await client.lead.findMany({
    select: leadSelect,
    where: { AND: conditions },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
  });
  const leads = rows
    .slice(0, query.limit)
    .map((lead) => toLeadView(lead, contactsVisible));
  return {
    leads,
    contactsVisible,
    nextCursor: rows.length > query.limit ? leads.at(-1)?.id : undefined,
  };
};

export const getDealerLeadDetail = async (
  actor: DurableOrganizationActor,
  leadId: string,
  client: LeadClient = database
) => {
  const member = await requireLeadMember(actor, client);
  const lead = await client.lead.findFirst({
    select: leadSelect,
    where: { AND: [leadScope(actor.dealerOrgId, member), { id: leadId }] },
  });
  if (!lead) {
    return null;
  }
  const [events, members] = await Promise.all([
    client.auditLog.findMany({
      select: { id: true, action: true, createdAt: true },
      where: {
        dealerOrgId: actor.dealerOrgId,
        entityType: "lead",
        entityId: lead.id,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    }),
    canAssignDealerLeads(member.role)
      ? client.dealerMember.findMany({
          select: {
            id: true,
            role: true,
            account: {
              select: { sellerProfile: { select: { displayName: true } } },
            },
          },
          where: {
            dealerOrgId: actor.dealerOrgId,
            disabledAt: null,
            clerkDeletedAt: null,
            status: "active",
            role: { in: ["owner", "manager", "sales"] },
            account: { deletedAt: null, status: "active" },
          },
          orderBy: { id: "asc" },
          take: 100,
        })
      : [],
  ]);
  return {
    lead: toLeadView(lead, canReadLeadContacts(member.role)),
    events,
    members,
    member,
  };
};

export const updateDealerLead = async (
  actor: DurableOrganizationActor,
  input: DealerLeadChange,
  client: PrismaClient = database
) => {
  const change = dealerLeadChangeSchema.parse(input);
  return await client.$transaction(async (tx) => {
    const member = await requireLeadMember(actor, tx);
    const lead = await tx.lead.findFirst({
      select: {
        id: true,
        status: true,
        assignedDealerMemberId: true,
        updatedAt: true,
        firstViewedAt: true,
        respondedAt: true,
        closedAt: true,
      },
      where: {
        AND: [leadScope(actor.dealerOrgId, member), { id: change.leadId }],
      },
    });
    if (
      !(
        lead &&
        canChangeDealerLead({
          role: member.role,
          memberId: member.id,
          currentAssigneeId: lead.assignedDealerMemberId,
          nextAssigneeId: change.assignedMemberId,
          currentStatus: lead.status,
          nextStatus: change.status,
        })
      )
    ) {
      throw new OrganizationAuthorizationError(
        "Enquiry operation is not authorized"
      );
    }
    if (change.assignedMemberId) {
      const assignee = await tx.dealerMember.findFirst({
        select: { id: true },
        where: {
          id: change.assignedMemberId,
          dealerOrgId: actor.dealerOrgId,
          status: "active",
          disabledAt: null,
          clerkDeletedAt: null,
          role: { in: ["owner", "manager", "sales"] },
          account: { deletedAt: null, status: "active" },
        },
      });
      if (!assignee) {
        throw new OrganizationAuthorizationError(
          "Assignee is not active in this organization"
        );
      }
    }
    const now = new Date(Math.max(Date.now(), lead.updatedAt.getTime() + 1));
    const changed = await tx.lead.updateMany({
      where: {
        id: lead.id,
        dealerOrgId: actor.dealerOrgId,
        deletedAt: null,
        updatedAt: new Date(change.expectedUpdatedAt),
      },
      data: {
        status: change.status,
        assignedDealerMemberId: change.assignedMemberId,
        updatedAt: now,
        ...(change.status === "viewed" && !lead.firstViewedAt
          ? { firstViewedAt: now }
          : {}),
        ...(change.status === "contacted" && !lead.respondedAt
          ? { respondedAt: now }
          : {}),
        closedAt: ["won", "lost", "closed", "spam"].includes(change.status)
          ? (lead.closedAt ?? now)
          : null,
      },
    });
    if (changed.count !== 1) {
      throw new DealerLeadConflictError(
        "Enquiry changed; reload before saving"
      );
    }
    await tx.auditLog.create({
      data: {
        action: "lead.updated",
        actorAccountId: actor.accountId,
        actorType: "account",
        dealerOrgId: actor.dealerOrgId,
        entityType: "lead",
        entityId: lead.id,
        metadata: {
          previousStatus: lead.status,
          status: change.status,
          assignmentChanged:
            lead.assignedDealerMemberId !== change.assignedMemberId,
        },
      },
    });
    return { id: lead.id };
  });
};
