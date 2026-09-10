import "server-only";

import type { PublicLeadInput } from "@repo/marketplace-domain";
import {
  ensureMarketplaceAccount,
  getMarketplaceAccountByClerkUserId,
} from "./accounts";
import type { Prisma, PrismaClient } from "./generated/client";
import { database } from "./index";
import { findCurrentPublicMarketplacePublicationForInquiry } from "./inventory-ingestion";

interface CreatePublicLeadOptions {
  readonly buyerClerkUserId?: string;
  readonly client?: PrismaClient;
  readonly clientMessageId?: string;
}

export interface ConversationPageOptions {
  readonly cursor?: string;
  readonly limit?: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_ACTIVE_DEALER_MEMBERSHIPS = 100;
const MESSAGE_RATE_LIMIT_PER_MINUTE = 60;
const MESSAGE_IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const getPageSize = (limit?: number) =>
  Math.min(Math.max(limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

const normalizeOptionalLeadValue = (value: string | null | undefined) =>
  value || null;

const publicLeadReplayMatches = (
  existingLead: {
    buyerCountryCode: string | null;
    buyerLocale: string | null;
    buyerName: string | null;
    deletedAt: Date | null;
    email: string | null;
    intent: PublicLeadInput["intent"] | null;
    listingId: string | null;
    message: string | null;
    phone: string | null;
  },
  input: PublicLeadInput
) =>
  existingLead.deletedAt === null &&
  existingLead.listingId === input.listingId &&
  existingLead.buyerCountryCode ===
    normalizeOptionalLeadValue(input.buyerCountryCode) &&
  existingLead.buyerLocale === normalizeOptionalLeadValue(input.buyerLocale) &&
  existingLead.buyerName === input.buyerName &&
  existingLead.email === normalizeOptionalLeadValue(input.email) &&
  existingLead.intent === input.intent &&
  existingLead.message === input.message &&
  existingLead.phone === normalizeOptionalLeadValue(input.phone);

export const createPublicLead = async (
  input: PublicLeadInput,
  options: CreatePublicLeadOptions = {}
) =>
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: lead, thread, participants and audit must commit atomically.
  (options.client ?? database).$transaction(async (tx) => {
    if (input.inquiryDedupeKey) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.inquiryDedupeKey}))`;
      const existingLead = await tx.lead.findUnique({
        where: { inquiryDedupeKey: input.inquiryDedupeKey },
      });
      if (existingLead) {
        if (!publicLeadReplayMatches(existingLead, input)) {
          throw new Error("Inquiry idempotency key payload does not match");
        }
        return existingLead;
      }
    }

    const listing = await tx.marketplaceListing.findFirst({
      select: {
        dealerOrgId: true,
        id: true,
        inventoryOfferId: true,
        sellerProfile: { select: { accountId: true, id: true } },
        sellerProfileId: true,
        slug: true,
        title: true,
      },
      where: {
        deletedAt: null,
        id: input.listingId,
        OR: [
          {
            dealerOrg: {
              is: { clerkDeletedAt: null, deletedAt: null },
            },
          },
          {
            dealerOrgId: null,
            sellerProfile: {
              is: {
                account: { is: { deletedAt: null, status: "active" } },
                deletedAt: null,
                status: "active",
              },
            },
          },
        ],
        status: "active",
      },
    });

    if (!listing) {
      throw new Error("Listing is not available");
    }

    if (!(options.buyerClerkUserId || listing.dealerOrgId)) {
      throw new Error(
        "Anonymous private-seller lead delivery is not configured"
      );
    }

    if (listing.inventoryOfferId && !input.buyerCountryCode) {
      throw new Error(
        "A delivery destination is required for imported inventory"
      );
    }

    const marketPublication =
      input.buyerCountryCode && listing.inventoryOfferId
        ? await findCurrentPublicMarketplacePublicationForInquiry(tx, {
            destinationCountryCode: input.buyerCountryCode,
            supplierOfferId: listing.inventoryOfferId,
          })
        : null;

    if (
      input.buyerCountryCode &&
      listing.inventoryOfferId &&
      !marketPublication
    ) {
      throw new Error("Destination is not currently eligible");
    }

    const buyerAccount = options.buyerClerkUserId
      ? await ensureMarketplaceAccount(options.buyerClerkUserId, tx)
      : null;
    const lead = await tx.lead.create({
      data: {
        buyerAccountId: buyerAccount?.id,
        buyerCountryCode: input.buyerCountryCode,
        buyerLocale: input.buyerLocale,
        buyerName: input.buyerName,
        channel: buyerAccount ? "in_app" : "web_form",
        contactMethod: buyerAccount ? "message" : "form",
        dealerOrgId: listing.dealerOrgId,
        email: input.email || undefined,
        intent: input.intent,
        inquiryDedupeKey: input.inquiryDedupeKey,
        listingId: listing.id,
        marketPublicationId: marketPublication?.id,
        message: input.message,
        phone: input.phone || undefined,
        sellerProfileId: listing.sellerProfileId,
        source: "listing",
      },
    });

    const canCreateConversation = Boolean(
      buyerAccount && (listing.dealerOrgId || listing.sellerProfile?.accountId)
    );

    if (buyerAccount && canCreateConversation) {
      const conversation = await tx.conversation.create({
        data: {
          dealerOrgId: listing.dealerOrgId,
          lastMessageAt: new Date(),
          leadId: lead.id,
          listingId: listing.id,
          sellerProfileId: listing.sellerProfileId,
          subject: listing.title,
        },
      });
      const buyerParticipant = await tx.conversationParticipant.create({
        data: {
          accountId: buyerAccount.id,
          conversationId: conversation.id,
          role: "buyer",
        },
      });

      const sellerParticipants: Array<{
        accountId: string;
        dealerMemberId?: string;
        role: "dealer_member" | "private_seller";
      }> = [];

      if (listing.dealerOrgId) {
        const members = await tx.dealerMember.findMany({
          orderBy: { id: "asc" },
          select: { accountId: true, id: true },
          take: MAX_ACTIVE_DEALER_MEMBERSHIPS,
          where: {
            account: { deletedAt: null, status: "active" },
            accountId: { not: buyerAccount.id },
            clerkDeletedAt: null,
            dealerOrg: { clerkDeletedAt: null, deletedAt: null },
            dealerOrgId: listing.dealerOrgId,
            disabledAt: null,
            status: "active",
          },
        });
        sellerParticipants.push(
          ...members.map((member) => ({
            accountId: member.accountId,
            dealerMemberId: member.id,
            role: "dealer_member" as const,
          }))
        );
      } else if (
        listing.sellerProfile?.accountId &&
        listing.sellerProfile.accountId !== buyerAccount.id
      ) {
        sellerParticipants.push({
          accountId: listing.sellerProfile.accountId,
          role: "private_seller",
        });
      }

      if (sellerParticipants.length > 0) {
        await tx.conversationParticipant.createMany({
          data: sellerParticipants.map((participant) => ({
            ...participant,
            conversationId: conversation.id,
          })),
        });
      }
      const createdSellerParticipantIds =
        sellerParticipants.length === 0
          ? []
          : (
              await tx.conversationParticipant.findMany({
                select: { id: true },
                where: {
                  accountId: {
                    in: sellerParticipants.map(({ accountId }) => accountId),
                  },
                  conversationId: conversation.id,
                },
              })
            ).map(({ id }) => id);

      const message = await tx.conversationMessage.create({
        data: {
          body: input.message,
          clientMessageId: options.clientMessageId,
          conversationId: conversation.id,
          senderParticipantId: buyerParticipant.id,
        },
      });

      await tx.conversationReadState.create({
        data: {
          conversationId: conversation.id,
          lastReadAt: message.createdAt,
          lastReadMessageId: message.id,
          participantId: buyerParticipant.id,
        },
      });
      if (createdSellerParticipantIds.length > 0) {
        await tx.conversationReadState.createMany({
          data: createdSellerParticipantIds.map((participantId) => ({
            conversationId: conversation.id,
            participantId,
          })),
        });
      }
    }

    await tx.auditLog.create({
      data: {
        action: "lead.created",
        actorAccountId: buyerAccount?.id,
        actorType: buyerAccount ? "account" : "system",
        dealerOrgId: listing.dealerOrgId,
        entityId: lead.id,
        entityType: "lead",
        metadata: {
          ...(input.buyerCountryCode
            ? { buyerCountryCode: input.buyerCountryCode }
            : {}),
          listingId: listing.id,
          deliveryChannel: listing.dealerOrgId
            ? "dealer_inbox"
            : "authenticated_conversation",
          deliveryState: "delivered",
          ...(marketPublication
            ? { marketPublicationId: marketPublication.id }
            : {}),
        },
      },
    });

    return lead;
  });

export const listDealerLeads = (
  dealerOrgId: string,
  options: ConversationPageOptions = {}
) =>
  database.lead.findMany({
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : undefined),
    include: {
      assignedDealerMember: {
        select: { accountId: true, id: true, role: true },
      },
      conversation: {
        select: { id: true, lastMessageAt: true, status: true },
      },
      listing: { select: { id: true, slug: true, title: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: getPageSize(options.limit),
    where: { dealerOrgId, deletedAt: null },
  });

export const listBuyerConversations = async (
  clerkUserId: string,
  options: ConversationPageOptions = {}
) => {
  const account = await getMarketplaceAccountByClerkUserId(clerkUserId);

  if (!account) {
    return [];
  }

  const activeDealerMemberships = await database.dealerMember.findMany({
    orderBy: { id: "asc" },
    select: { dealerOrgId: true, id: true },
    take: MAX_ACTIVE_DEALER_MEMBERSHIPS + 1,
    where: {
      accountId: account.id,
      clerkDeletedAt: null,
      dealerOrg: { clerkDeletedAt: null, deletedAt: null },
      disabledAt: null,
      status: "active",
    },
  });
  if (activeDealerMemberships.length > MAX_ACTIVE_DEALER_MEMBERSHIPS) {
    throw new Error("Conversation membership scope exceeds supported limit");
  }
  const personalParticipantAccess: Prisma.ConversationParticipantWhereInput = {
    accountId: account.id,
    dealerMemberId: null,
    leftAt: null,
    role: { in: ["buyer", "private_seller"] },
  };
  const conversationAccess: Prisma.ConversationWhereInput[] = [
    { participants: { some: personalParticipantAccess } },
    ...activeDealerMemberships.map((membership) => ({
      dealerOrgId: membership.dealerOrgId,
      participants: {
        some: {
          accountId: account.id,
          dealerMemberId: membership.id,
          leftAt: null,
          role: "dealer_member" as const,
        },
      },
    })),
  ];
  const visibleParticipantAccess: Prisma.ConversationParticipantWhereInput[] = [
    personalParticipantAccess,
    ...activeDealerMemberships.map((membership) => ({
      accountId: account.id,
      dealerMemberId: membership.id,
      leftAt: null,
      role: "dealer_member" as const,
    })),
  ];

  const conversations = await database.conversation.findMany({
    ...(options.cursor
      ? { cursor: { id: options.cursor }, skip: 1 }
      : undefined),
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      participants: {
        include: { readState: true },
        where: { OR: visibleParticipantAccess },
      },
      listing: { select: { slug: true, title: true } },
    },
    orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
    take: getPageSize(options.limit),
    where: { OR: conversationAccess },
  });

  return conversations;
};

export const markConversationRead = async ({
  clerkUserId,
  conversationId,
}: {
  readonly clerkUserId: string;
  readonly conversationId: string;
}) =>
  database.$transaction(async (tx) => {
    const account = await getMarketplaceAccountByClerkUserId(clerkUserId, tx);
    if (!account) {
      throw new Error("Conversation access denied");
    }

    const activeDealerMemberships = await tx.dealerMember.findMany({
      orderBy: { id: "asc" },
      select: { id: true },
      take: MAX_ACTIVE_DEALER_MEMBERSHIPS + 1,
      where: {
        accountId: account.id,
        clerkDeletedAt: null,
        dealerOrg: { clerkDeletedAt: null, deletedAt: null },
        disabledAt: null,
        status: "active",
      },
    });
    if (activeDealerMemberships.length > MAX_ACTIVE_DEALER_MEMBERSHIPS) {
      throw new Error("Conversation membership scope exceeds supported limit");
    }
    const participant = await tx.conversationParticipant.findFirst({
      select: { id: true },
      where: {
        accountId: account.id,
        conversationId,
        leftAt: null,
        OR: [
          {
            dealerMemberId: null,
            role: { in: ["buyer", "private_seller"] },
          },
          ...activeDealerMemberships.map(({ id }) => ({
            dealerMemberId: id,
            role: "dealer_member" as const,
          })),
        ],
      },
    });
    if (!participant) {
      throw new Error("Conversation access denied");
    }

    const latestMessage = await tx.conversationMessage.findFirst({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
      where: { conversationId, deletedAt: null },
    });
    if (!latestMessage) {
      return { marked: false } as const;
    }

    const readAt = new Date();
    await tx.conversationReadState.upsert({
      create: {
        conversationId,
        lastReadAt: readAt,
        lastReadMessageId: latestMessage.id,
        participantId: participant.id,
      },
      update: {
        lastReadAt: readAt,
        lastReadMessageId: latestMessage.id,
      },
      where: { participantId: participant.id },
    });
    return { marked: true } as const;
  });

interface SendConversationMessageInput {
  readonly body: string;
  readonly clerkUserId: string;
  readonly clientMessageId: string;
  readonly conversationId: string;
}

export const sendConversationMessage = async (
  input: SendConversationMessageInput
) => {
  const body = input.body.trim();
  if (body.length < 1 || body.length > 3000) {
    throw new Error("Message must be between 1 and 3000 characters");
  }
  if (!MESSAGE_IDEMPOTENCY_KEY_PATTERN.test(input.clientMessageId)) {
    throw new Error("Message idempotency key is invalid");
  }

  return await database.$transaction(async (tx) => {
    const account = await ensureMarketplaceAccount(input.clerkUserId, tx);
    const participant = await tx.conversationParticipant.findFirst({
      include: {
        conversation: { select: { dealerOrgId: true, status: true } },
        dealerMember: {
          include: { dealerOrg: { select: { deletedAt: true } } },
        },
      },
      where: {
        accountId: account.id,
        conversationId: input.conversationId,
        leftAt: null,
      },
    });

    const personalParticipantIsAuthorized = Boolean(
      participant &&
        participant.dealerMemberId === null &&
        (participant.role === "buyer" || participant.role === "private_seller")
    );
    const dealerParticipantIsAuthorized = Boolean(
      participant?.role === "dealer_member" &&
        participant.dealerMember &&
        participant.dealerMember.accountId === account.id &&
        participant.dealerMember.status === "active" &&
        participant.dealerMember.disabledAt === null &&
        participant.dealerMember.clerkDeletedAt === null &&
        participant.dealerMember.dealerOrg.deletedAt === null &&
        participant.dealerMember.dealerOrgId ===
          participant.conversation.dealerOrgId
    );

    if (
      !(
        participant &&
        (personalParticipantIsAuthorized || dealerParticipantIsAuthorized)
      )
    ) {
      throw new Error("Conversation access denied");
    }

    if (participant.conversation.status !== "open") {
      throw new Error("Conversation is not open");
    }

    const messageLockKey = `conversation-message:${participant.id}`;
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext(${messageLockKey}))::text AS lock_result
    `;
    const replay = await tx.conversationMessage.findUnique({
      where: {
        conversationId_clientMessageId: {
          clientMessageId: input.clientMessageId,
          conversationId: input.conversationId,
        },
      },
    });
    if (replay && replay.senderParticipantId !== participant.id) {
      throw new Error("Message idempotency key belongs to another participant");
    }
    const sentInWindow = replay
      ? 0
      : await tx.conversationMessage.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 60_000) },
            senderParticipantId: participant.id,
          },
        });
    if (!replay && sentInWindow >= MESSAGE_RATE_LIMIT_PER_MINUTE) {
      throw new Error("Message rate limit exceeded");
    }
    const message =
      replay ??
      (await tx.conversationMessage.create({
        data: {
          body,
          clientMessageId: input.clientMessageId,
          conversationId: input.conversationId,
          senderParticipantId: participant.id,
        },
      }));
    await tx.conversation.updateMany({
      data: { lastMessageAt: message.createdAt },
      where: {
        id: input.conversationId,
        OR: [
          { lastMessageAt: null },
          { lastMessageAt: { lte: message.createdAt } },
        ],
      },
    });
    await tx.conversationReadState.upsert({
      create: {
        conversationId: input.conversationId,
        participantId: participant.id,
      },
      update: {},
      where: { participantId: participant.id },
    });
    await tx.conversationReadState.updateMany({
      data: {
        lastReadAt: message.createdAt,
        lastReadMessageId: message.id,
      },
      where: {
        participantId: participant.id,
        OR: [{ lastReadAt: null }, { lastReadAt: { lte: message.createdAt } }],
      },
    });

    return message;
  });
};
