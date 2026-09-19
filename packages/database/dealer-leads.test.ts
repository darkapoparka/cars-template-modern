import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DealerLeadConflictError,
  getDealerLeadPage,
  updateDealerLead,
} from "./dealer-leads";
import type { PrismaClient } from "./generated/client";
import { OrganizationAuthorizationError } from "./organization-access";

vi.mock("./index", () => ({ database: {} }));
const actor = {
  accountId: "account-a",
  dealerOrgId: "org-a",
  role: "owner" as const,
};
const time = new Date("2026-09-19T00:00:00.000Z");
const lead = {
  id: "lead-a",
  status: "new",
  assignedDealerMemberId: null,
  updatedAt: time,
  createdAt: time,
  firstViewedAt: null,
  respondedAt: null,
  buyerName: "Private person",
  email: "private@example.invalid",
  phone: "+359000000000",
  message: "Private enquiry",
};
const db = {
  dealerMember: { findFirst: vi.fn() },
  lead: { findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn(),
};
const client = db as unknown as PrismaClient;
const change = {
  leadId: "lead-a",
  expectedUpdatedAt: time.toISOString(),
  status: "contacted" as const,
  assignedMemberId: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  db.dealerMember.findFirst.mockResolvedValue({
    id: "member-a",
    role: "owner",
  });
  db.lead.findFirst.mockResolvedValue(lead);
  db.lead.findMany.mockResolvedValue([lead]);
  db.lead.updateMany.mockResolvedValue({ count: 1 });
  db.$transaction.mockImplementation((operation) => operation(db));
});
describe("dealer inbox tenant and concurrency boundaries", () => {
  it("paginates more than fifty enquiries without silently truncating the inbox", async () => {
    const records = Array.from({ length: 75 }, (_, index) => ({
      ...lead,
      id: `lead-${index}`,
      createdAt: new Date(time.getTime() - index * 1000),
    }));
    db.lead.findMany
      .mockResolvedValueOnce(records.slice(0, 51))
      .mockResolvedValueOnce(records.slice(50));
    db.lead.findFirst.mockResolvedValue(records[49]);
    const first = await getDealerLeadPage(actor, { limit: 50 }, client);
    const second = await getDealerLeadPage(
      actor,
      { limit: 50, cursor: first.nextCursor },
      client
    );
    expect(first.leads).toHaveLength(50);
    expect(first.nextCursor).toBe("lead-49");
    expect(second.leads).toHaveLength(25);
    expect(second.nextCursor).toBeUndefined();
    expect(
      new Set([...first.leads, ...second.leads].map((row) => row.id)).size
    ).toBe(75);
    expect(db.lead.findMany.mock.calls[1][0].take).toBe(51);
  });
  it("advances the optimistic version even when the clock equals the stored timestamp", async () => {
    vi.spyOn(Date, "now").mockReturnValue(time.getTime());
    try {
      await updateDealerLead(actor, change, client);
      expect(
        db.lead.updateMany.mock.calls[0][0].data.updatedAt.getTime()
      ).toBeGreaterThan(time.getTime());
    } finally {
      vi.restoreAllMocks();
    }
  });
  it("rechecks durable membership and scopes every listing query", async () => {
    await getDealerLeadPage(actor, {}, client);
    expect(db.dealerMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          accountId: "account-a",
          dealerOrgId: "org-a",
          status: "active",
          disabledAt: null,
        }),
      })
    );
    expect(db.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.objectContaining({ dealerOrgId: "org-a", deletedAt: null }),
          ],
        },
        take: 26,
      })
    );
  });
  it("denies a revoked member before reading enquiries", async () => {
    db.dealerMember.findFirst.mockResolvedValue(null);
    await expect(getDealerLeadPage(actor, {}, client)).rejects.toBeInstanceOf(
      OrganizationAuthorizationError
    );
    expect(db.lead.findMany).not.toHaveBeenCalled();
  });
  it("uses durable role rather than trusting an actor role snapshot", async () => {
    db.dealerMember.findFirst.mockResolvedValue({
      id: "member-a",
      role: "viewer",
    });
    const result = await getDealerLeadPage(actor, {}, client);
    expect(result.contactsVisible).toBe(false);
    expect(result.leads[0]).toMatchObject({
      buyerName: null,
      email: null,
      phone: null,
      message: null,
    });
    await expect(
      updateDealerLead(actor, change, client)
    ).rejects.toBeInstanceOf(OrganizationAuthorizationError);
  });
  it("rejects a foreign or deleted cursor instead of resolving it outside the organization", async () => {
    db.lead.findFirst.mockResolvedValue(null);
    await expect(
      getDealerLeadPage(actor, { cursor: "foreign" }, client)
    ).rejects.toBeInstanceOf(DealerLeadConflictError);
    expect(db.lead.findMany).not.toHaveBeenCalled();
    expect(db.lead.findFirst.mock.calls[0][0].where.AND).toContainEqual(
      expect.objectContaining({ dealerOrgId: "org-a" })
    );
  });
  it("returns a bounded next cursor without skipping the first next-page row", async () => {
    db.lead.findMany.mockResolvedValue([lead, { ...lead, id: "lead-b" }]);
    const result = await getDealerLeadPage(actor, { limit: 1 }, client);
    expect(result.leads).toHaveLength(1);
    expect(result.nextCursor).toBe("lead-a");
  });
  it("guards update by organization and version and writes a non-PII audit in the transaction", async () => {
    await updateDealerLead(actor, change, client);
    expect(db.lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "lead-a",
          dealerOrgId: "org-a",
          deletedAt: null,
          updatedAt: time,
        },
      })
    );
    const audit = db.auditLog.create.mock.calls[0][0].data;
    expect(audit).toMatchObject({
      dealerOrgId: "org-a",
      actorAccountId: "account-a",
      entityId: "lead-a",
      action: "lead.updated",
    });
    expect(JSON.stringify(audit)).not.toContain("private@example.invalid");
  });
  it("does not move the closure time when a closed enquiry is reassigned", async () => {
    const closedAt = new Date("2026-09-18T09:00:00.000Z");
    db.lead.findFirst.mockResolvedValue({ ...lead, status: "won", closedAt });
    await updateDealerLead(
      actor,
      { ...change, status: "won", assignedMemberId: "member-a" },
      client
    );
    expect(db.lead.updateMany.mock.calls[0][0].data.closedAt).toEqual(closedAt);
  });
  it("clears the closure time only when an authorized member reopens an enquiry", async () => {
    db.lead.findFirst.mockResolvedValue({
      ...lead,
      status: "closed",
      closedAt: time,
    });
    await updateDealerLead(actor, { ...change, status: "new" }, client);
    expect(db.lead.updateMany.mock.calls[0][0].data.closedAt).toBeNull();
  });
  it("restricts sales queries to their assigned and unassigned enquiries", async () => {
    db.dealerMember.findFirst.mockResolvedValue({
      id: "member-a",
      role: "sales",
    });
    await getDealerLeadPage(actor, {}, client);
    expect(db.lead.findMany.mock.calls[0][0].where.AND[0]).toMatchObject({
      dealerOrgId: "org-a",
      OR: [
        { assignedDealerMemberId: "member-a" },
        { assignedDealerMemberId: null },
      ],
    });
  });
  it("fails stale writes without appending an audit success", async () => {
    db.lead.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      updateDealerLead(actor, change, client)
    ).rejects.toBeInstanceOf(DealerLeadConflictError);
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it("validates assignees against the same organization", async () => {
    db.dealerMember.findFirst
      .mockResolvedValueOnce({ id: "member-a", role: "owner" })
      .mockResolvedValueOnce(null);
    await expect(
      updateDealerLead(
        actor,
        { ...change, assignedMemberId: "foreign-member" },
        client
      )
    ).rejects.toBeInstanceOf(OrganizationAuthorizationError);
    expect(db.lead.updateMany).not.toHaveBeenCalled();
    expect(db.dealerMember.findFirst.mock.calls[1][0].where).toMatchObject({
      dealerOrgId: "org-a",
      id: "foreign-member",
      disabledAt: null,
    });
  });
});
