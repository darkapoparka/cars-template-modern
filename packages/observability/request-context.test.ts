import { describe, expect, it } from "vitest";
import {
  attachCorrelationId,
  CORRELATION_ID_HEADER,
  getCorrelationId,
  isValidCorrelationId,
} from "./request-context";

describe("request correlation", () => {
  it("preserves a valid incoming correlation id", () => {
    expect(getCorrelationId({ "x-correlation-id": "req_12345678" })).toBe(
      "req_12345678"
    );
  });

  it("replaces invalid or attacker-controlled values", () => {
    const generated = getCorrelationId({
      "x-correlation-id": "invalid\r\nheader: injected",
    });

    expect(generated).not.toContain("injected");
    expect(isValidCorrelationId(generated)).toBe(true);
  });

  it("adds the id to the response", () => {
    const response = attachCorrelationId(new Response("OK"), "req_12345678");
    expect(response.headers.get(CORRELATION_ID_HEADER)).toBe("req_12345678");
  });
});
