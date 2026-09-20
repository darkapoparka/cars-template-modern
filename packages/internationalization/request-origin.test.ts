import { describe, expect, it } from "vitest";
import { createLocalePolicy } from "./policy";
import { preferenceRequestOrigin } from "./request-origin";

const policy = createLocalePolicy({
  schemaVersion: 1,
  dealerId: "test",
  dealerName: "Test",
  defaultLocale: "en",
  enabledLocales: ["en", "bg"] as const,
  dealerCountry: "BG",
  inventoryCurrency: "EUR",
  formatLocales: { en: "en-GB", bg: "bg-BG" },
  preferenceMaxAge: 15_552_000,
  promptVersion: "v1",
  suggestedLanguages: { BG: "bg" },
});
const body = {
  action: "save",
  locale: "bg",
  country: "DE",
  returnTo: "/en/contact?topic=trade-in",
};
const request = (
  host = "127.0.0.1:3002",
  origin = "http://127.0.0.1:3002",
  url = "http://localhost:3002/api/preferences"
) =>
  new Request(url, {
    method: "POST",
    headers: { host, origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
describe("strict origin at the native Next loopback boundary", () => {
  it("preserves a same-origin loopback request body and accepts explicit preferences", async () => {
    const adjusted = preferenceRequestOrigin(request());
    expect(adjusted.url).toBe("http://127.0.0.1:3002/api/preferences");
    const result = await policy.preferenceResponse(adjusted);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      destination: "/bg/contact?topic=trade-in",
    });
  });
  it.each([
    "http://foreign.invalid",
    "null",
    "http://127.0.0.1:3003",
    "https://127.0.0.1:3002",
  ])("still rejects cross-origin %s", async (origin) =>
    expect(
      (
        await policy.preferenceResponse(
          preferenceRequestOrigin(request("127.0.0.1:3002", origin))
        )
      ).status
    ).toBe(403));
  it.each([
    "foreign.invalid",
    "127.0.0.1:3003",
    "127.0.0.1:3002.foreign.invalid",
  ])("never trusts an arbitrary host %s", (host) => {
    const input = request(host);
    expect(preferenceRequestOrigin(input)).toBe(input);
  });
  it("does not rewrite a production domain even with a forged loopback Host", () => {
    const input = request(
      "127.0.0.1:3002",
      "https://dealer.example",
      "https://dealer.example:3002/api/preferences"
    );
    expect(preferenceRequestOrigin(input)).toBe(input);
  });
});
