import "server-only";

import type { PrismaClient } from "./generated/client";
import { database } from "./index";

declare const trustedKybAdminBrand: unique symbol;

export interface TrustedKybAdminAuthorization {
  readonly accountId: string;
  readonly [trustedKybAdminBrand]: true;
}

const trustedKybAdminAuthorizations = new WeakSet<object>();

export const issueTrustedKybAdminAuthorization = async (
  input: { readonly adminRoleVerified: boolean; readonly clerkUserId: string },
  client: PrismaClient = database
): Promise<TrustedKybAdminAuthorization> => {
  if (!input.adminRoleVerified) {
    throw new Error("KYB admin authority is required");
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
    throw new Error("KYB admin account is not actively provisioned");
  }
  const authorization = Object.freeze({
    accountId: account.id,
  }) as TrustedKybAdminAuthorization;
  trustedKybAdminAuthorizations.add(authorization);
  return authorization;
};

export const readTrustedKybAdminAuthorization = (
  authorization: TrustedKybAdminAuthorization
) => {
  if (!trustedKybAdminAuthorizations.has(authorization)) {
    throw new Error("KYB admin authority is not trusted");
  }
  return authorization;
};
