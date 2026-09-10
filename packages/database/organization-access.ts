import "server-only";

import type { DealerRole, Prisma, PrismaClient } from "./generated/client";
import { database } from "./index";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export interface DurableOrganizationActor {
  readonly accountId: string;
  readonly dealerOrgId: string;
  readonly role: DealerRole;
}

export class OrganizationAuthorizationError extends Error {
  readonly code = "organization_authorization_denied";
}

export const requireOrganizationActor = async (
  input: {
    readonly allowedRoles?: readonly DealerRole[];
    readonly clerkOrgId: string;
    readonly clerkUserId: string;
  },
  client: DatabaseClient = database
): Promise<DurableOrganizationActor> => {
  const account = await client.marketplaceAccount.findFirst({
    select: { id: true },
    where: {
      clerkUserId: input.clerkUserId,
      deletedAt: null,
      status: "active",
    },
  });
  const organization = await client.dealerOrg.findFirst({
    select: { id: true },
    where: { clerkOrgId: input.clerkOrgId, deletedAt: null },
  });

  if (!(account && organization)) {
    throw new OrganizationAuthorizationError(
      "Organization membership is not actively provisioned"
    );
  }

  const member = await client.dealerMember.findFirst({
    select: { role: true },
    where: {
      accountId: account.id,
      clerkDeletedAt: null,
      dealerOrgId: organization.id,
      disabledAt: null,
      status: "active",
    },
  });

  if (
    !member ||
    (input.allowedRoles && !input.allowedRoles.includes(member.role))
  ) {
    throw new OrganizationAuthorizationError(
      "Organization membership is not authorized"
    );
  }

  return {
    accountId: account.id,
    dealerOrgId: organization.id,
    role: member.role,
  };
};

export const assertOrganizationActorRole = (
  actor: DurableOrganizationActor,
  allowedRoles: readonly DealerRole[]
): void => {
  if (!allowedRoles.includes(actor.role)) {
    throw new OrganizationAuthorizationError(
      "Organization role is not authorized for this operation"
    );
  }
};
