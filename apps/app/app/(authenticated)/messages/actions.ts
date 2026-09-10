"use server";

import { auth } from "@repo/auth/server";
import {
  markConversationRead,
  sendConversationMessage,
} from "@repo/database/leads";
import { revalidatePath } from "next/cache";

export const sendMessageAction = async (formData: FormData) => {
  const session = await auth();
  if (!session.userId) {
    session.redirectToSignIn();
    throw new Error("Authentication required");
  }
  const conversationId = formData.get("conversationId");
  const clientMessageId = formData.get("clientMessageId");
  const body = formData.get("body");
  if (
    typeof conversationId !== "string" ||
    typeof clientMessageId !== "string" ||
    typeof body !== "string"
  ) {
    throw new Error("Invalid message");
  }
  await sendConversationMessage({
    body,
    clientMessageId,
    clerkUserId: session.userId,
    conversationId,
  });
  revalidatePath("/messages");
};

export const markConversationViewedAction = async (formData: FormData) => {
  const session = await auth();
  if (!session.userId) {
    session.redirectToSignIn();
    throw new Error("Authentication required");
  }
  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string" || !conversationId) {
    throw new Error("Invalid conversation");
  }
  await markConversationRead({
    clerkUserId: session.userId,
    conversationId,
  });
  revalidatePath("/messages");
};
