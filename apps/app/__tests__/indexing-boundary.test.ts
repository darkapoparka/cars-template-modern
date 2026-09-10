import { describe, expect, it } from "vitest";
import { appIndexingMetadata } from "../app/indexing-policy";
import robots from "../app/robots";

describe("authenticated app indexing boundary", () => {
  it("marks all rendered app pages as noindex and nofollow", () => {
    expect(appIndexingMetadata.robots).toEqual({
      follow: false,
      index: false,
    });
  });

  it("disallows every crawler from the authenticated origin", () => {
    expect(robots()).toEqual({
      rules: {
        disallow: "/",
        userAgent: "*",
      },
    });
  });
});
