import { describe, expect, it } from "vitest";
import {
  defaultOrganizationDirectoryCardLabels,
  getFeaturedOrganizationSignals,
  getOrganizationInitials,
  resolveOrganizationDirectoryCardData,
} from "./organization-directory-card-policy";
import type { OrganizationDirectoryCardData } from "./organization-directory-card-types";

const organization: OrganizationDirectoryCardData = {
  id: "dealer-1",
  name: "Day Night Auto",
  profileAction: { href: "/dealers/day-night", label: "Profile" },
  typeLabel: "Dealer",
};

describe("organization directory card policy", () => {
  it("builds stable initials", () => {
    expect(getOrganizationInitials("Day Night Auto")).toBe("DN");
    expect(getOrganizationInitials(" ")).toBe("AM");
  });

  it("prioritizes verification signals", () => {
    expect(
      getFeaturedOrganizationSignals([
        { kind: "claimed", label: "Claimed" },
        { kind: "business_verified", label: "Verified" },
        { kind: "official_authorization", label: "Official" },
      ]).map((signal) => signal.kind)
    ).toEqual(["official_authorization", "business_verified"]);
  });

  it("normalizes optional collections and labels", () => {
    const resolved = resolveOrganizationDirectoryCardData(organization, {
      profile: "Профил",
    });

    expect(resolved.badges).toEqual([]);
    expect(resolved.brands).toEqual([]);
    expect(resolved.labels.profile).toBe("Профил");
    expect(resolved.labels.to).toBe(defaultOrganizationDirectoryCardLabels.to);
  });
});
