import { expect, test } from "vitest";
import { GET } from "../app/health/route";

test("Health Check", async () => {
  const response = GET(
    new Request("http://localhost:3002/health", {
      headers: { "x-correlation-id": "req_health_1234" },
    })
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-correlation-id")).toBe("req_health_1234");
  expect(await response.json()).toEqual({
    service: "automarket-api",
    status: "ok",
  });
});
