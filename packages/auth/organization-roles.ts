export const clerkOrganizationRoles = [
  "org:owner",
  "org:admin",
  "org:member",
] as const;

export type ClerkOrganizationRole = (typeof clerkOrganizationRoles)[number];
export type DurableDealerRole = "owner" | "manager" | "sales" | "viewer";

export interface MappedOrganizationRole {
  readonly clerkRole: string;
  readonly durableRole: DurableDealerRole;
  readonly recognized: boolean;
}

export const mapClerkOrganizationRole = (
  clerkRole: string | null | undefined
): MappedOrganizationRole => {
  if (clerkRole === "org:owner") {
    return { clerkRole, durableRole: "owner", recognized: true };
  }
  if (clerkRole === "org:admin") {
    return { clerkRole, durableRole: "manager", recognized: true };
  }
  if (clerkRole === "org:member") {
    return { clerkRole, durableRole: "sales", recognized: true };
  }
  return {
    clerkRole: clerkRole ?? "unknown",
    durableRole: "viewer",
    recognized: false,
  };
};

export const isRecognizedClerkOrganizationRole = (
  role: string | null | undefined
): role is ClerkOrganizationRole => mapClerkOrganizationRole(role).recognized;
