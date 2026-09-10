import "server-only";

import type { PrismaClient } from "./generated/client";
import { database } from "./index";

declare const trustedDirectoryAdminBrand: unique symbol;

export interface TrustedDirectoryAdminAuthorization {
  readonly accountId: string;
  readonly [trustedDirectoryAdminBrand]: true;
}

const trustedAuthorizations = new WeakSet<object>();

export const issueTrustedDirectoryAdminAuthorization = async (
  input: { readonly adminRoleVerified: boolean; readonly clerkUserId: string },
  client: PrismaClient = database
): Promise<TrustedDirectoryAdminAuthorization> => {
  if (!input.adminRoleVerified) {
    throw new Error("Directory admin authority is required");
  }

  const account = await client.marketplaceAccount.findFirst({
    select: { id: true },
    where: {
      clerkUserId: input.clerkUserId,
      deletedAt: null,
      status: "active",
    },
  });
  if (!account) {
    throw new Error("Directory admin account is not actively provisioned");
  }

  const authorization = Object.freeze({
    accountId: account.id,
  }) as TrustedDirectoryAdminAuthorization;
  trustedAuthorizations.add(authorization);
  return authorization;
};

export const readTrustedDirectoryAdminAuthorization = (
  authorization: TrustedDirectoryAdminAuthorization
) => {
  if (!trustedAuthorizations.has(authorization)) {
    throw new Error("Directory admin authority is not trusted");
  }

  return authorization;
};
