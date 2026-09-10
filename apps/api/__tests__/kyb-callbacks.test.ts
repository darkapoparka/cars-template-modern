import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, test, vi } from "vitest";

const boundary = vi.hoisted(() => ({
  recordKybDocumentScanResult: vi.fn(),
  recordKybProviderCheckResult: vi.fn(),
}));

vi.mock("@repo/database/kyb-documents", () => ({
  KybDocumentConflictError: class KybDocumentConflictError extends Error {},
  recordKybDocumentScanResult: boundary.recordKybDocumentScanResult,
}));
vi.mock("@repo/database/organization-verification", () => ({
  OrganizationVerificationConflictError: class OrganizationVerificationConflictError extends Error {},
  recordKybProviderCheckResult: boundary.recordKybProviderCheckResult,
}));
vi.mock("@/lib/idempotent-webhook", () => ({
  hashIdempotentWebhookPayload: () => "a".repeat(64),
  processIdempotentWebhook: async ({
    process,
  }: {
    process: () => Promise<void>;
  }) => {
    await process();
    return "processed";
  },
}));
vi.mock("@/env", () => ({
  env: {
    KYB_PROVIDER_CALLBACK_SECRET: "provider-callback-secret-at-least-32-bytes",
    KYB_SCANNER_CALLBACK_SECRET: "scanner-callback-secret-at-least-32-bytes!",
  },
}));

const callbackRequest = (body: unknown, secret: string, eventId: string) => {
  const text = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${eventId}.${text}`)
    .digest("hex");
  return new Request("https://api.example/callback", {
    body: text,
    headers: {
      "x-automarket-event-id": eventId,
      "x-automarket-signature": `sha256=${signature}`,
      "x-automarket-timestamp": timestamp,
    },
    method: "POST",
  });
};

describe("KYB evidence callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boundary.recordKybProviderCheckResult.mockResolvedValue({
      duplicate: false,
    });
    boundary.recordKybDocumentScanResult.mockResolvedValue({
      id: "doc_123456",
    });
  });

  test("records provider evidence without creating approval or grants", async () => {
    const { POST } = await import(
      "../app/webhooks/verification/provider/route"
    );
    const response = await POST(
      callbackRequest(
        {
          checkId: "check_123456",
          normalizedResultCode: "registry_match",
          riskLevel: "low",
          status: "passed",
        },
        "provider-callback-secret-at-least-32-bytes",
        "provider_evt_1"
      )
    );
    expect(response.status).toBe(200);
    expect(boundary.recordKybProviderCheckResult).toHaveBeenCalledWith(
      expect.objectContaining({
        checkId: "check_123456",
        payloadHash: "a".repeat(64),
        providerEventId: "provider_evt_1",
      })
    );
    expect(
      JSON.stringify(boundary.recordKybProviderCheckResult.mock.calls)
    ).not.toContain("approval");
  });

  test("rejects provider evidence for a non-pending check", async () => {
    const { OrganizationVerificationConflictError } = await import(
      "@repo/database/organization-verification"
    );
    boundary.recordKybProviderCheckResult.mockRejectedValue(
      new OrganizationVerificationConflictError("not pending")
    );
    const { POST } = await import(
      "../app/webhooks/verification/provider/route"
    );
    const response = await POST(
      callbackRequest(
        {
          checkId: "check_123456",
          normalizedResultCode: "registry_match",
          riskLevel: "low",
          status: "passed",
        },
        "provider-callback-secret-at-least-32-bytes",
        "provider_evt_2"
      )
    );
    expect(response.status).toBe(409);
  });

  test("returns retryable failure for transient provider storage errors", async () => {
    boundary.recordKybProviderCheckResult.mockRejectedValue(
      new Error("database unavailable")
    );
    const { POST } = await import(
      "../app/webhooks/verification/provider/route"
    );
    const response = await POST(
      callbackRequest(
        {
          checkId: "check_123456",
          normalizedResultCode: "registry_match",
          riskLevel: "low",
          status: "passed",
        },
        "provider-callback-secret-at-least-32-bytes",
        "provider_evt_transient"
      )
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("scanner callback records only the document evidence transition", async () => {
    const { POST } = await import("../app/webhooks/verification/scanner/route");
    const response = await POST(
      callbackRequest(
        {
          accepted: true,
          documentId: "document_123456",
        },
        "scanner-callback-secret-at-least-32-bytes!",
        "scanner_evt_1"
      )
    );
    expect(response.status).toBe(200);
    expect(boundary.recordKybDocumentScanResult).toHaveBeenCalledWith({
      accepted: true,
      documentId: "document_123456",
      payloadHash: "a".repeat(64),
      providerEventId: "scanner_evt_1",
    });
  });

  test("rejects scanner-controlled retention metadata", async () => {
    const { POST } = await import("../app/webhooks/verification/scanner/route");
    const response = await POST(
      callbackRequest(
        {
          accepted: true,
          documentId: "document_123456",
          retainUntil: "2020-01-01T00:00:00.000Z",
        },
        "scanner-callback-secret-at-least-32-bytes!",
        "scanner_evt_retention"
      )
    );
    expect(response.status).toBe(422);
    expect(boundary.recordKybDocumentScanResult).not.toHaveBeenCalled();
  });

  test("signed callback errors never echo evidence", async () => {
    const { POST } = await import(
      "../app/webhooks/verification/provider/route"
    );
    const request = callbackRequest(
      { evidenceUrl: "https://private.example/evidence" },
      "provider-callback-secret-at-least-32-bytes",
      "provider_evt_3"
    );
    request.headers.set("x-automarket-signature", `sha256=${"0".repeat(64)}`);
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(await response.text()).not.toContain("private.example");
  });
});
