import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findAccount: vi.fn(),
  findConversations: vi.fn(),
  findDealerMembers: vi.fn(),
  transaction: vi.fn(),
  upsertReadState: vi.fn(),
}));

vi.mock("./index", () => ({
  database: {
    $transaction: mocks.transaction,
    conversation: { findMany: mocks.findConversations },
    conversationReadState: { upsert: mocks.upsertReadState },
    dealerMember: { findMany: mocks.findDealerMembers },
    marketplaceAccount: { findFirst: mocks.findAccount },
  },
}));
vi.mock("./inventory-ingestion", () => ({
  findCurrentPublicMarketplacePublicationForInquiry: vi.fn(),
}));

import {
  listBuyerConversations,
  markConversationRead,
  sendConversationMessage,
} from "./leads";

describe("buyer conversation account boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findDealerMembers.mockResolvedValue([]);
    mocks.findConversations.mockResolvedValue([]);
  });

  test("returns no conversations unless the durable account is active", async () => {
    mocks.findAccount.mockResolvedValue(null);

    await expect(listBuyerConversations("user_disabled")).resolves.toEqual([]);
    expect(mocks.findAccount).toHaveBeenCalledWith({
      where: {
        clerkUserId: "user_disabled",
        deletedAt: null,
        status: "active",
      },
    });
    expect(mocks.findConversations).not.toHaveBeenCalled();
    expect(mocks.upsertReadState).not.toHaveBeenCalled();
  });

  test("does not authorize a dealer conversation without an active durable membership", async () => {
    mocks.findAccount.mockResolvedValue({ id: "account_1" });

    await expect(listBuyerConversations("former_dealer")).resolves.toEqual([]);

    expect(mocks.findDealerMembers).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      select: { dealerOrgId: true, id: true },
      take: 101,
      where: {
        accountId: "account_1",
        clerkDeletedAt: null,
        dealerOrg: { clerkDeletedAt: null, deletedAt: null },
        disabledAt: null,
        status: "active",
      },
    });
    expect(mocks.findConversations).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
        take: 50,
        where: {
          OR: [
            {
              participants: {
                some: {
                  accountId: "account_1",
                  dealerMemberId: null,
                  leftAt: null,
                  role: { in: ["buyer", "private_seller"] },
                },
              },
            },
          ],
        },
      })
    );
    expect(mocks.upsertReadState).not.toHaveBeenCalled();
  });

  test("fails closed before conversation reads when membership scope is excessive", async () => {
    mocks.findAccount.mockResolvedValue({ id: "account_1" });
    mocks.findDealerMembers.mockResolvedValue(
      Array.from({ length: 101 }, (_, index) => ({
        dealerOrgId: `dealer_${index}`,
        id: `member_${index}`,
      }))
    );

    await expect(listBuyerConversations("user_1")).rejects.toThrow(
      "Conversation membership scope exceeds supported limit"
    );
    expect(mocks.findConversations).not.toHaveBeenCalled();
  });

  test("marks only an explicitly viewed authorized conversation as read", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "read_1" });
    const tx = {
      conversationMessage: {
        findFirst: vi.fn().mockResolvedValue({ id: "message_1" }),
      },
      conversationParticipant: {
        findFirst: vi.fn().mockResolvedValue({ id: "participant_1" }),
      },
      conversationReadState: { upsert },
      dealerMember: { findMany: vi.fn().mockResolvedValue([]) },
      marketplaceAccount: {
        findFirst: vi.fn().mockResolvedValue({ id: "account_1" }),
      },
    };
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation(tx)
    );

    await expect(
      markConversationRead({
        clerkUserId: "user_1",
        conversationId: "conversation_1",
      })
    ).resolves.toEqual({ marked: true });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          conversationId: "conversation_1",
          lastReadMessageId: "message_1",
          participantId: "participant_1",
        }),
        where: { participantId: "participant_1" },
      })
    );
  });

  test("rejects message sends for a disabled dealer participant", async () => {
    const tx = {
      conversationParticipant: {
        findFirst: vi.fn().mockResolvedValue({
          accountId: "account_1",
          conversation: { dealerOrgId: "dealer_1", status: "open" },
          dealerMember: {
            accountId: "account_1",
            clerkDeletedAt: new Date(),
            dealerOrg: { deletedAt: null },
            dealerOrgId: "dealer_1",
            disabledAt: new Date(),
            status: "disabled",
          },
          dealerMemberId: "member_1",
          leftAt: null,
          role: "dealer_member",
        }),
      },
      marketplaceAccount: {
        upsert: vi.fn().mockResolvedValue({
          deletedAt: null,
          id: "account_1",
          status: "active",
        }),
      },
    };
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation(tx)
    );

    await expect(
      sendConversationMessage({
        body: "I should not be able to send this",
        clerkUserId: "former_dealer",
        clientMessageId: "client_1",
        conversationId: "conversation_1",
      })
    ).rejects.toThrow("Conversation access denied");
  });

  test("rejects oversized message idempotency keys before opening a transaction", async () => {
    await expect(
      sendConversationMessage({
        body: "Hello",
        clerkUserId: "user_1",
        clientMessageId: "x".repeat(129),
        conversationId: "conversation_1",
      })
    ).rejects.toThrow("Message idempotency key is invalid");

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  test("rejects an idempotency-key collision owned by another participant", async () => {
    const updateConversation = vi.fn();
    const tx = {
      conversation: { updateMany: updateConversation },
      conversationMessage: {
        findUnique: vi.fn().mockResolvedValue({
          createdAt: new Date("2026-07-22T10:00:00.000Z"),
          id: "message_other",
          senderParticipantId: "participant_other",
        }),
      },
      conversationParticipant: {
        findFirst: vi.fn().mockResolvedValue({
          accountId: "account_1",
          conversation: { dealerOrgId: null, status: "open" },
          dealerMember: null,
          dealerMemberId: null,
          id: "participant_1",
          role: "buyer",
        }),
      },
      marketplaceAccount: {
        upsert: vi.fn().mockResolvedValue({
          deletedAt: null,
          id: "account_1",
          status: "active",
        }),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation(tx)
    );

    await expect(
      sendConversationMessage({
        body: "Hello",
        clerkUserId: "user_1",
        clientMessageId: "client_1",
        conversationId: "conversation_1",
      })
    ).rejects.toThrow("Message idempotency key belongs to another participant");
    expect(updateConversation).not.toHaveBeenCalled();
  });

  test("does not regress conversation ordering when an old message is replayed", async () => {
    const messageCreatedAt = new Date("2026-07-22T10:00:00.000Z");
    const updateConversation = vi.fn().mockResolvedValue({ count: 0 });
    const tx = {
      conversation: { updateMany: updateConversation },
      conversationMessage: {
        findUnique: vi.fn().mockResolvedValue({
          createdAt: messageCreatedAt,
          id: "message_1",
          senderParticipantId: "participant_1",
        }),
      },
      conversationParticipant: {
        findFirst: vi.fn().mockResolvedValue({
          accountId: "account_1",
          conversation: { dealerOrgId: null, status: "open" },
          dealerMember: null,
          dealerMemberId: null,
          id: "participant_1",
          role: "buyer",
        }),
      },
      conversationReadState: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        upsert: vi.fn().mockResolvedValue({}),
      },
      marketplaceAccount: {
        upsert: vi.fn().mockResolvedValue({
          deletedAt: null,
          id: "account_1",
          status: "active",
        }),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
    };
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation(tx)
    );

    await sendConversationMessage({
      body: "Hello",
      clerkUserId: "user_1",
      clientMessageId: "client_1",
      conversationId: "conversation_1",
    });

    expect(updateConversation).toHaveBeenCalledWith({
      data: { lastMessageAt: messageCreatedAt },
      where: {
        id: "conversation_1",
        OR: [
          { lastMessageAt: null },
          { lastMessageAt: { lte: messageCreatedAt } },
        ],
      },
    });
    expect(tx.conversationReadState.updateMany).toHaveBeenCalledWith({
      data: {
        lastReadAt: messageCreatedAt,
        lastReadMessageId: "message_1",
      },
      where: {
        participantId: "participant_1",
        OR: [{ lastReadAt: null }, { lastReadAt: { lte: messageCreatedAt } }],
      },
    });
  });

  test("rejects new messages in a closed conversation", async () => {
    const createMessage = vi.fn();
    const tx = {
      conversationMessage: { create: createMessage },
      conversationParticipant: {
        findFirst: vi.fn().mockResolvedValue({
          accountId: "account_1",
          conversation: { dealerOrgId: null, status: "closed" },
          dealerMember: null,
          dealerMemberId: null,
          id: "participant_1",
          role: "buyer",
        }),
      },
      marketplaceAccount: {
        upsert: vi.fn().mockResolvedValue({
          deletedAt: null,
          id: "account_1",
          status: "active",
        }),
      },
    };
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation(tx)
    );

    await expect(
      sendConversationMessage({
        body: "Hello",
        clerkUserId: "user_1",
        clientMessageId: "client_1",
        conversationId: "conversation_1",
      })
    ).rejects.toThrow("Conversation is not open");
    expect(createMessage).not.toHaveBeenCalled();
  });

  test("rate limits new messages after idempotent replay detection", async () => {
    const createMessage = vi.fn();
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      conversationMessage: {
        count: vi.fn().mockResolvedValue(60),
        create: createMessage,
        findUnique: vi.fn().mockResolvedValue(null),
      },
      conversationParticipant: {
        findFirst: vi.fn().mockResolvedValue({
          accountId: "account_1",
          conversation: { dealerOrgId: null, status: "open" },
          dealerMember: null,
          dealerMemberId: null,
          id: "participant_1",
          role: "buyer",
        }),
      },
      marketplaceAccount: {
        upsert: vi.fn().mockResolvedValue({
          deletedAt: null,
          id: "account_1",
          status: "active",
        }),
      },
    };
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation(tx)
    );

    await expect(
      sendConversationMessage({
        body: "Hello",
        clerkUserId: "user_1",
        clientMessageId: "client_61",
        conversationId: "conversation_1",
      })
    ).rejects.toThrow("Message rate limit exceeded");
    expect(createMessage).not.toHaveBeenCalled();
  });
});
