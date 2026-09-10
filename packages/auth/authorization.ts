interface SessionClaimsWithMetadata {
  metadata?: {
    role?: unknown;
  };
}

interface OrganizationSession {
  orgId?: string | null;
  orgRole?: string | null;
  userId?: string | null;
}

import {
  type DurableDealerRole,
  isRecognizedClerkOrganizationRole,
} from "./organization-roles";

export type OrganizationOperation =
  | "organization:view"
  | "organization:manage"
  | "kyb:submit"
  | "kyb:document:write"
  | "inventory:view"
  | "inventory:import"
  | "inventory:source:manage"
  | "inventory:snapshot:approve";

const allowedRoles: Readonly<
  Record<OrganizationOperation, readonly DurableDealerRole[]>
> = {
  "inventory:import": ["owner", "manager", "sales"],
  "inventory:snapshot:approve": ["owner", "manager"],
  "inventory:source:manage": ["owner", "manager"],
  "inventory:view": ["owner", "manager", "sales", "viewer"],
  "kyb:document:write": ["owner", "manager"],
  "kyb:submit": ["owner", "manager"],
  "organization:manage": ["owner", "manager"],
  "organization:view": ["owner", "manager", "sales", "viewer"],
};

export const hasAdminRole = (sessionClaims: unknown): boolean => {
  if (!sessionClaims || typeof sessionClaims !== "object") {
    return false;
  }

  const claims = sessionClaims as SessionClaimsWithMetadata;

  return claims.metadata?.role === "admin";
};

export const hasActiveOrganization = (
  session: OrganizationSession
): session is Required<OrganizationSession> =>
  Boolean(
    session.userId &&
      session.orgId &&
      isRecognizedClerkOrganizationRole(session.orgRole)
  );

export const matchesActiveOrganization = (
  activeOrgId: string,
  resourceOrgId: string
): boolean => activeOrgId === resourceOrgId;

interface DurableMemberAuthorizationInput {
  readonly accountActive: boolean;
  readonly activeClerkOrgId: string;
  readonly memberRole: DurableDealerRole;
  readonly memberStatus: "active" | "invited" | "disabled";
  readonly operation: OrganizationOperation;
  readonly organizationDeleted: boolean;
  readonly resourceClerkOrgId: string;
}

export const canDurableMemberPerform = ({
  accountActive,
  activeClerkOrgId,
  memberRole,
  memberStatus,
  operation,
  organizationDeleted,
  resourceClerkOrgId,
}: DurableMemberAuthorizationInput): boolean =>
  accountActive &&
  !organizationDeleted &&
  memberStatus === "active" &&
  activeClerkOrgId === resourceClerkOrgId &&
  allowedRoles[operation].includes(memberRole);
