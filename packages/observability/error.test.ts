import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocks.captureException,
}));

vi.mock("./log", () => ({
  log: { error: mocks.logError },
}));

import { parseError } from "./error";

describe("parseError", () => {
  beforeEach(() => {
    mocks.captureException.mockReset();
    mocks.logError.mockReset();
  });

  it("captures the original throwable so its stack and cause are preserved", () => {
    const cause = new Error("database unavailable");
    const error = new Error("request failed for buyer@example.com", { cause });

    expect(parseError(error)).toBe("request failed for [REDACTED]");
    expect(mocks.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        extra: { originalErrorName: "Error" },
      })
    );
    expect(mocks.captureException.mock.calls[0]?.[0]).toBe(error);
  });

  it("normalizes non-string message fields before redaction", () => {
    expect(parseError({ message: 503 })).toBe("503");
  });
});
