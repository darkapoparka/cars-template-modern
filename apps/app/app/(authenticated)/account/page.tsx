import { UserProfile } from "@repo/auth/client";
import { auth, currentUser } from "@repo/auth/server";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { MailIcon, UserCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "../components/header";

export const metadata: Metadata = {
  title: "Профил",
  description: "Управлявайте своя профил в AutoMarket.",
};

const AccountPage = async () => {
  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  const displayName =
    user?.fullName ?? user?.firstName ?? "Купувач в AutoMarket";

  return (
    <>
      <Header page="Профил" pages={["AutoMarket", "Купувач"]} />
      <main className="flex flex-1 flex-col gap-5 p-3 sm:p-4 lg:p-6">
        <section className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="h-fit rounded-lg border border-border bg-card p-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <UserCircleIcon className="size-6" />
            </div>
            <h1 className="mt-3 font-semibold text-xl">{displayName}</h1>
            {primaryEmail && (
              <p className="mt-1 flex items-center gap-2 text-muted-foreground text-sm">
                <MailIcon className="size-4" />
                {primaryEmail}
              </p>
            )}
            <Badge className="mt-4" variant="secondary">
              <UserCircleIcon className="size-3.5" />
              Личен профил
            </Badge>
            <p className="mt-2 text-muted-foreground text-xs leading-5">
              Вписването потвърждава достъпа до профила, но не означава публично
              проверен продавач.
            </p>
            <Alert className="mt-4">
              <AlertTitle>Поверителност</AlertTitle>
              <AlertDescription>
                Запазените автомобили, търсенията и запитванията са достъпни
                само за вашия вписан потребителски профил.
              </AlertDescription>
            </Alert>
          </aside>
          <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card p-2 sm:p-4">
            <UserProfile
              appearance={{
                elements: { cardBox: "w-full shadow-none", rootBox: "w-full" },
              }}
              routing="hash"
            />
          </section>
        </section>
      </main>
    </>
  );
};

export default AccountPage;
