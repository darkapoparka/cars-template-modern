import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn semantic typography", () => {
  it.each([
    {
      input: "text-meta text-zinc-600",
      expected: ["text-meta", "text-zinc-600"],
    },
    {
      input: "text-white text-compact-control",
      expected: ["text-white", "text-compact-control"],
    },
  ])("keeps custom font sizes alongside colors: $input", ({
    input,
    expected,
  }) => {
    const classes = new Set(cn(input).split(" "));
    for (const className of expected) {
      expect(classes.has(className)).toBe(true);
    }
  });
  it.each([
    {
      classes: ["text-sm", "text-compact-control"],
      expected: "text-compact-control",
    },
    { classes: ["text-lg", "text-card-title"], expected: "text-card-title" },
    { classes: ["text-card-title", "text-lg"], expected: "text-lg" },
  ])("resolves ordered font-size conflicts: $expected", ({
    classes,
    expected,
  }) => {
    expect(cn(classes.join(" "))).toBe(expected);
  });
});
