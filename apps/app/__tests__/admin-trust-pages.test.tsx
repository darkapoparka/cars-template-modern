import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorization: { accountId: "account_admin" },
  getCase: vi.fn(),
  listQueue: vi.fn(),
  notFound: vi.fn(),
  requireAuthorization: vi.fn(),
}));
const privateEvidenceDisclaimer =
  /частни байтове, ключове за съхранение, хешове/;

vi.mock("@repo/database/organization-verification", () => ({
  getKybAdminReviewCase: mocks.getCase,
  listKybAdminReviewQueue: mocks.listQueue,
}));
vi.mock("../app/(authenticated)/admin/trust/authorization", () => ({
  requireKybAdminAuthorization: mocks.requireAuthorization,
}));
vi.mock("../app/(authenticated)/admin/trust/actions", () => ({
  recordKybReviewDecisionAction: vi.fn(),
  transitionKybVerificationGrantAction: vi.fn(),
}));
vi.mock("../app/(authenticated)/components/header", () => ({
  Header: ({ page }: { page: string }) => <header>{page}</header>,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import VerificationCasePage from "../app/(authenticated)/admin/trust/[caseId]/page";
import TrustQueuePage from "../app/(authenticated)/admin/trust/page";

const queueCase = {
  _count: { documents: 2 },
  attempt: 1,
  createdAt: new Date("2026-07-13T08:00:00.000Z"),
  dealerOrg: {
    city: "Sofia",
    countryCode: "BG",
    displayName: "Example Motors",
    id: "dealer_123456",
    kybStatus: "in_review",
    orgType: "dealer",
  },
  id: "case_123456",
  legalEntity: {
    entityType: "private_company",
    legalName: "Example Motors EOOD",
    registrationCountryCode: "BG",
    tradingName: "Example Motors",
  },
  providerChecks: [
    {
      completedAt: new Date("2026-07-13T09:30:00.000Z"),
      requestedAt: new Date("2026-07-13T09:00:00.000Z"),
      riskLevel: "low",
      status: "passed",
    },
  ],
  status: "manual_review",
  submittedAt: new Date("2026-07-13T08:30:00.000Z"),
  updatedAt: new Date("2026-07-13T09:30:00.000Z"),
  version: 3,
};

const detailCase = {
  attempt: 1,
  createdAt: new Date("2026-07-13T08:00:00.000Z"),
  dealerOrg: {
    city: "Sofia",
    countryCode: "BG",
    currentVerificationGrant: null,
    displayName: "Example Motors",
    id: "dealer_123456",
    kybStatus: "in_review",
    orgType: "dealer",
  },
  decidedAt: null,
  documents: [
    {
      createdAt: new Date("2026-07-13T08:45:00.000Z"),
      id: "document_123456",
      kind: "company_registry_extract",
      legalHold: false,
      mimeType: "application/pdf",
      purgedAt: null,
      retainUntil: null,
      status: "accepted",
      updatedAt: new Date("2026-07-13T09:00:00.000Z"),
      verifiedByteSize: 2048,
    },
  ],
  events: [
    {
      actorType: "provider",
      afterKybStatus: "in_review",
      beforeKybStatus: "pending",
      eventType: "provider_result_recorded",
      id: "event_123456",
      occurredAt: new Date("2026-07-13T09:30:00.000Z"),
      reasonCodes: [],
    },
  ],
  id: "case_123456",
  legalEntity: {
    addressCountryCode: "BG",
    addressLine1: "1 Example Street",
    addressLine2: null,
    city: "Sofia",
    entityType: "private_company",
    incorporationDate: new Date("2020-01-01T00:00:00.000Z"),
    legalName: "Example Motors EOOD",
    postalCode: "1000",
    region: null,
    registrationCountryCode: "BG",
    registrationNumber: "123456789",
    tradingName: "Example Motors",
  },
  policyVersion: "m2-v1",
  providerChecks: [
    {
      checkType: "registry",
      completedAt: new Date("2026-07-13T09:30:00.000Z"),
      id: "check_123456",
      normalizedResultCode: "registry_match",
      requestedAt: new Date("2026-07-13T09:00:00.000Z"),
      riskLevel: "low",
      status: "passed",
    },
  ],
  requirementsVersion: "m2-v1",
  reviewDecisions: [],
  status: "manual_review",
  submittedAt: new Date("2026-07-13T08:30:00.000Z"),
  updatedAt: new Date("2026-07-13T09:30:00.000Z"),
  version: 3,
};

describe("admin trust pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue(mocks.authorization);
    mocks.listQueue.mockResolvedValue({ cases: [queueCase], total: 1 });
    mocks.getCase.mockResolvedValue(detailCase);
    mocks.notFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  test("loads the real queue through branded authorization", async () => {
    render(await TrustQueuePage({ searchParams: Promise.resolve({}) }));

    expect(mocks.requireAuthorization).toHaveBeenCalledTimes(1);
    expect(mocks.listQueue).toHaveBeenCalledWith({
      authorization: mocks.authorization,
      limit: 100,
    });
    expect(screen.getAllByText("Example Motors").length).toBeGreaterThan(0);
    expect(
      screen
        .getByRole("link", { name: "Преглед на случая" })
        .getAttribute("href")
    ).toBe("/admin/trust/case_123456");
  });

  test("loads metadata-only detail and renders durable decision forms", async () => {
    render(
      await VerificationCasePage({
        params: Promise.resolve({ caseId: "case_123456" }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(mocks.getCase).toHaveBeenCalledWith({
      authorization: mocks.authorization,
      kybCaseId: "case_123456",
    });
    expect(screen.getByText("Company registry extract")).not.toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Одобряване и издаване на разрешение",
      })
    ).not.toBeNull();
    expect(screen.getByText(privateEvidenceDisclaimer)).not.toBeNull();
  });

  test("does not request forbidden private evidence fields in the app surface", () => {
    const source = readFileSync(
      "app/(authenticated)/admin/trust/[caseId]/page.tsx",
      "utf8"
    );
    for (const forbidden of [
      "storageKey",
      "objectKey",
      "sha256",
      "encryptionKeyVersion",
      "providerEventId",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
