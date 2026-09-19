import { describe, expect, it } from "vitest";
import {
  canChangeDealerLead,
  canReadLeadContacts,
  dealerLeadChangeSchema,
  dealerLeadQuerySchema,
} from "./lead-workflow";

const change = {
  memberId: "self",
  currentAssigneeId: "self",
  nextAssigneeId: "self",
  currentStatus: "new",
  nextStatus: "contacted",
} as const;
describe("dealer lead permissions and validation", () => {
  it.each([
    "owner",
    "manager",
  ] as const)("allows team operations for %s", (role) => {
    expect(
      canChangeDealerLead({
        ...change,
        role,
        currentAssigneeId: "other",
        nextAssigneeId: "another",
      })
    ).toBe(true);
  });
  it("allows sales to claim and process their own unassigned enquiry", () => {
    expect(
      canChangeDealerLead({ ...change, role: "sales", currentAssigneeId: null })
    ).toBe(true);
  });
  it("denies editing someone else's enquiry, reassignment and reopening terminal work", () => {
    expect(
      canChangeDealerLead({
        ...change,
        role: "sales",
        currentAssigneeId: "other",
      })
    ).toBe(false);
    expect(
      canChangeDealerLead({ ...change, role: "sales", nextAssigneeId: "other" })
    ).toBe(false);
    expect(
      canChangeDealerLead({ ...change, role: "sales", currentStatus: "won" })
    ).toBe(false);
    expect(canChangeDealerLead({ ...change, role: "viewer" })).toBe(false);
  });
  it("excludes customer contact data from viewer projections", () => {
    expect(canReadLeadContacts("viewer")).toBe(false);
    expect(canReadLeadContacts("sales")).toBe(true);
  });
  it("bounds reads and requires concurrency evidence", () => {
    expect(dealerLeadQuerySchema.parse({}).limit).toBe(25);
    expect(dealerLeadQuerySchema.safeParse({ limit: 1000 }).success).toBe(
      false
    );
    expect(
      dealerLeadQuerySchema.safeParse({ status: "invented" }).success
    ).toBe(false);
    expect(
      dealerLeadChangeSchema.safeParse({ leadId: "a", status: "won" }).success
    ).toBe(false);
  });
});
