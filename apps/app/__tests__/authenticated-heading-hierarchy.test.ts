import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const readAppSource = (path: string) =>
  readFileSync(resolve(process.cwd(), "app", "(authenticated)", path), "utf8");

describe("authenticated page heading hierarchy", () => {
  test.each([
    "sell/listings/page.tsx",
    "dealer/leads/page.tsx",
  ])("%s has one page h1 and uses h2 for repeated records", (path) => {
    const source = readAppSource(path);
    expect(source.match(/<h1\b/g)).toHaveLength(1);
    expect(source).toContain("<h2");
  });
});
