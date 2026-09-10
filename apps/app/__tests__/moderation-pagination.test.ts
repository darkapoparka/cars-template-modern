import { describe, expect, test } from "vitest";
import {
  getCanonicalModerationPage,
  getModerationSeveritySlices,
} from "../app/(authenticated)/admin/moderation/moderation-pagination";

describe("moderation queue pagination", () => {
  test("fills the first page in risk order", () => {
    expect(
      getModerationSeveritySlices({ high: 20, low: 80, medium: 40 }, 1)
    ).toEqual({
      high: { skip: 0, take: 20 },
      low: { skip: 0, take: 0 },
      medium: { skip: 0, take: 30 },
    });
  });

  test("continues across severity boundaries without omitting high risk", () => {
    expect(
      getModerationSeveritySlices({ high: 70, low: 80, medium: 40 }, 2)
    ).toEqual({
      high: { skip: 50, take: 20 },
      low: { skip: 0, take: 0 },
      medium: { skip: 0, take: 30 },
    });
  });

  test("moves into lower risk results on later pages", () => {
    expect(
      getModerationSeveritySlices({ high: 20, low: 80, medium: 40 }, 3)
    ).toEqual({
      high: { skip: 20, take: 0 },
      low: { skip: 40, take: 40 },
      medium: { skip: 40, take: 0 },
    });
  });

  test("clamps stale page requests to the canonical queue page", () => {
    expect(getCanonicalModerationPage(99, 101)).toEqual({
      currentPage: 3,
      pageCount: 3,
    });
    expect(getCanonicalModerationPage(4, 0)).toEqual({
      currentPage: 1,
      pageCount: 1,
    });
  });
});
