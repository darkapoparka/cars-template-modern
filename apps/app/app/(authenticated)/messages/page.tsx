import { randomUUID } from "node:crypto";
import { auth } from "@repo/auth/server";
import { listBuyerConversations } from "@repo/database/leads";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { MessageSquareIcon } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "../components/header";
import { markConversationViewedAction, sendMessageAction } from "./actions";

export const metadata: Metadata = {
  title: "Съобщения",
  description: "Вашите лични разговори в AutoMarket.",
};

const MessagesPage = async () => {
  const session = await auth();
  if (!session.userId) {
    return session.redirectToSignIn();
  }
  const conversations = await listBuyerConversations(session.userId);

  return (
    <>
      <Header page="Съобщения" pages={["AutoMarket", "Купувач"]} />
      <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
        <div>
          <h1 className="font-semibold text-xl">Лични разговори</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Съобщенията и състоянието им на прочитане се съхраняват в защитени
            разговори за всеки участник.
          </p>
        </div>
        {conversations.map((conversation) => (
          <article
            className="rounded-lg border bg-card p-4"
            key={conversation.id}
          >
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="h-4 w-4" />
              <h2 className="font-medium">{conversation.subject}</h2>
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-secondary p-3 text-sm">
              {conversation.messages[0]?.body ?? "Все още няма съобщения."}
            </p>
            <form action={markConversationViewedAction} className="mt-3">
              <input
                name="conversationId"
                type="hidden"
                value={conversation.id}
              />
              <Button type="submit" variant="ghost">
                Маркирай като прочетен
              </Button>
            </form>
            <form action={sendMessageAction} className="mt-3 flex gap-2">
              <input
                name="conversationId"
                type="hidden"
                value={conversation.id}
              />
              <input
                name="clientMessageId"
                type="hidden"
                value={randomUUID()}
              />
              <Input
                aria-label="Отговор"
                maxLength={3000}
                minLength={1}
                name="body"
                placeholder="Напишете отговор"
                required
              />
              <Button type="submit">Изпрати</Button>
            </form>
          </article>
        ))}
        {conversations.length === 0 && (
          <section className="rounded-lg border bg-card p-8 text-center">
            <MessageSquareIcon className="mx-auto h-6 w-6 text-muted-foreground" />
            <h2 className="mt-2 font-medium">Все още няма разговори</h2>
          </section>
        )}
      </main>
    </>
  );
};

export default MessagesPage;
