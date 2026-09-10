import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const providerStyles = readFileSync(
  new URL("./provider.module.css", import.meta.url),
  "utf8"
);
const bootstrapSource = readFileSync(
  new URL("./consent-bootstrap.ts", import.meta.url),
  "utf8"
);
const fixedPositionPattern = /position:\s*fixed/;
const zIndexPattern = /z-index\s*:/;

describe("analytics privacy control layout", () => {
  it("keeps consent controls in document flow below the dialog layer", () => {
    expect(providerStyles).not.toMatch(fixedPositionPattern);
    expect(providerStyles).not.toMatch(zIndexPattern);
  });

  it("reserves mobile bottom-navigation clearance for privacy access", () => {
    expect(providerStyles).toContain(
      "calc(4.75rem + env(safe-area-inset-bottom, 0px))"
    );
  });

  it("suppresses an already-decided banner before children can shift", () => {
    expect(providerStyles).toContain(
      ':global(html[data-analytics-consent-resolved="true"]) .consentRegion'
    );
    expect(bootstrapSource).toContain("analyticsConsentResolved");
    expect(bootstrapSource).toContain("ANALYTICS_CONSENT_STORAGE_KEY");
  });
});
