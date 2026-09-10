import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/observability/log", () => ({
  log: { info: vi.fn() },
}));

import { POST } from "./route";

describe("assisted search route", () => {
  it("returns filters and a canonical URL, never inventory objects", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/search", {
        body: JSON.stringify({
          basePath: "/bg/cars",
          category: "car",
          locale: "bg",
          query: "дизел автоматик до 30 000 лв в София",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.filters).toMatchObject({
      fuel: "diesel",
      priceMax: 30_000,
      transmission: "automatic",
    });
    expect(json.execution).toBe("canonical-url");
    expect(json).not.toHaveProperty("listings");
    expect(json).not.toHaveProperty("recommendations");
  });

  it("rejects invalid route context without exposing an internal error", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/search", {
        body: JSON.stringify({
          basePath: "https://attacker.example",
          category: "car",
          locale: "bg",
          query: "дизел",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe(
      "Use 2 to 500 characters and valid marketplace context."
    );
    expect(JSON.stringify(json)).not.toContain("ZodError");
  });
});
