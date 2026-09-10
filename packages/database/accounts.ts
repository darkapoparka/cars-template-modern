import "server-only";

import type { Prisma, PrismaClient } from "./generated/client";
import { database } from "./index";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export class MarketplaceAccountAccessError extends Error {
  readonly code = "marketplace_account_not_active";
}

export class SellerProfileAccessError extends Error {
  readonly code = "seller_profile_not_active";
}

export const getOrCreateMarketplaceAccountIdentity = (
  clerkUserId: string,
  client: DatabaseClient = database
) =>
  client.marketplaceAccount.upsert({
    create: { clerkUserId },
    update: {},
    where: { clerkUserId },
  });

export const getOrCreateActiveMarketplaceAccount = async (
  clerkUserId: string,
  client: DatabaseClient = database
) => {
  const account = await getOrCreateMarketplaceAccountIdentity(
    clerkUserId,
    client
  );

  return account.deletedAt === null && account.status === "active"
    ? account
    : null;
};

export const ensureMarketplaceAccount = async (
  clerkUserId: string,
  client: DatabaseClient = database
) => {
  const account = await getOrCreateActiveMarketplaceAccount(
    clerkUserId,
    client
  );

  if (!account) {
    throw new MarketplaceAccountAccessError(
      "Marketplace account is not actively provisioned"
    );
  }

  return account;
};

interface EnsureSellerProfileInput {
  readonly city: string;
  readonly clerkUserId: string;
  readonly displayName: string;
}

export const ensureSellerProfile = async (
  input: EnsureSellerProfileInput,
  client: DatabaseClient = database
) => {
  const account = await ensureMarketplaceAccount(input.clerkUserId, client);

  const sellerProfile = await client.sellerProfile.upsert({
    create: {
      accountId: account.id,
      city: input.city,
      displayName: input.displayName,
      status: "active",
      verificationStatus: "unverified",
    },
    update: {},
    where: { accountId: account.id },
  });

  if (sellerProfile.deletedAt || sellerProfile.status !== "active") {
    throw new SellerProfileAccessError(
      "Seller profile is not actively provisioned"
    );
  }

  const currentSellerProfile = await client.sellerProfile.update({
    data: {
      city: input.city,
      displayName: input.displayName,
    },
    where: { accountId: account.id },
  });

  return { account, sellerProfile: currentSellerProfile };
};

interface EnsureDealerActorInput {
  readonly allowedRoles?: readonly ("owner" | "manager" | "sales" | "viewer")[];
  readonly clerkOrgId: string;
  readonly clerkUserId: string;
  readonly orgRole?: string;
}

export const ensureDealerActor = async (
  input: EnsureDealerActorInput,
  client: DatabaseClient = database
) => {
  const dealerOrg = await client.dealerOrg.findFirst({
    where: {
      clerkDeletedAt: null,
      clerkOrgId: input.clerkOrgId,
      deletedAt: null,
    },
  });

  if (!dealerOrg) {
    throw new Error("Dealer organization is not provisioned");
  }

  const account = await client.marketplaceAccount.findFirst({
    where: {
      clerkUserId: input.clerkUserId,
      deletedAt: null,
      status: "active",
    },
  });

  if (!account) {
    throw new Error("Dealer account is not actively provisioned");
  }
  const member = await client.dealerMember.findFirst({
    where: {
      accountId: account.id,
      clerkDeletedAt: null,
      dealerOrgId: dealerOrg.id,
      disabledAt: null,
      status: "active",
    },
  });

  if (
    !member ||
    member.status !== "active" ||
    (input.allowedRoles && !input.allowedRoles.includes(member.role))
  ) {
    throw new Error("Dealer membership is not actively provisioned");
  }

  return { account, dealerOrg, member };
};

export const requireDurableDealerActor = ensureDealerActor;

export const getMarketplaceAccountByClerkUserId = (
  clerkUserId: string,
  client: DatabaseClient = database
) =>
  client.marketplaceAccount.findFirst({
    where: { clerkUserId, deletedAt: null, status: "active" },
  });
