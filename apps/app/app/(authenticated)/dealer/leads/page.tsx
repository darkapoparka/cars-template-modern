import {
  DealerLeadConflictError,
  getDealerLeadPage,
} from "@repo/database/dealer-leads";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  dealerLeadQuerySchema,
  dealerLeadStatuses,
} from "@repo/marketplace/lead-workflow";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { requireDealerOrganizationActor } from "../actor";
import {
  getDealerLeadIntentLabel,
  getDealerLeadStatusLabel,
} from "./dealer-lead-labels";

export const metadata: Metadata = {
  title: "Запитвания",
  description: "Запитвания към дилърската организация.",
  robots: { index: false, follow: false },
};

export default async function DealerLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireDealerOrganizationActor();
  const params = await searchParams;
  const parsed = dealerLeadQuerySchema.safeParse({
    q: params.q || undefined,
    status: params.status || undefined,
    cursor: params.cursor || undefined,
  });
  const query = parsed.success ? parsed.data : dealerLeadQuerySchema.parse({});
  const result = await getDealerLeadPage(actor, query).catch(
    (error: unknown) => {
      if (!(error instanceof DealerLeadConflictError)) {
        throw error;
      }
      return getDealerLeadPage(actor, { ...query, cursor: undefined });
    }
  );
  const nextQuery = new URLSearchParams();
  if (query.q) {
    nextQuery.set("q", query.q);
  }
  if (query.status) {
    nextQuery.set("status", query.status);
  }
  if (result.nextCursor) {
    nextQuery.set("cursor", result.nextCursor);
  }
  return (
    <>
      <Header page="Запитвания" pages={["Дилър"]} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 lg:p-6">
        <div>
          <h1 className="font-semibold text-page-title tracking-heading">
            Запитвания
          </h1>
          <p className="mt-2 text-body text-muted-foreground">
            Клиентски запитвания, статус и отговорник на едно място.
          </p>
        </div>
        {!result.contactsVisible && (
          <p className="rounded-lg border bg-control p-3 text-meta">
            Вашата роля показва само служебна информация. Личните данни на
            клиентите са скрити.
          </p>
        )}
        <form className="flex flex-wrap items-end gap-3" method="get">
          <label
            className="flex min-w-48 flex-1 flex-col gap-2 text-meta"
            htmlFor="lead-search"
          >
            Търсене
            <Input
              defaultValue={query.q}
              id="lead-search"
              maxLength={80}
              name="q"
              placeholder={
                result.contactsVisible
                  ? "Клиент, телефон, имейл или автомобил"
                  : "Автомобил"
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-meta">
            Статус
            <select
              className="h-9 rounded-md border bg-background px-3"
              defaultValue={query.status ?? ""}
              name="status"
            >
              <option value="">Всички статуси</option>
              {dealerLeadStatuses.map((status) => (
                <option key={status} value={status}>
                  {getDealerLeadStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Приложи</Button>
          <Button asChild variant="outline">
            <Link href="/dealer/leads">Изчисти</Link>
          </Button>
        </form>
        {result.leads.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <h2 className="font-semibold text-section-title">
              Няма запитвания
            </h2>
            <p className="mt-2 text-muted-foreground">
              Опитайте друг филтър. Новите запитвания ще се появят тук.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <ul className="divide-y">
              {result.leads.map((lead) => (
                <li key={lead.id}>
                  <Link
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-control focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px] sm:flex-row sm:items-center sm:justify-between"
                    href={`/dealer/leads/${encodeURIComponent(lead.id)}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-body">
                          {lead.buyerName ?? "Клиентско запитване"}
                        </h2>
                        <Badge variant="secondary">
                          {getDealerLeadStatusLabel(lead.status)}
                        </Badge>
                        {lead.intent && (
                          <span className="text-meta text-muted-foreground">
                            {getDealerLeadIntentLabel(lead.intent)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-meta">
                        {lead.listing?.title ?? "Общо запитване"}
                      </p>
                      {lead.message && (
                        <p className="mt-1 line-clamp-1 text-meta text-muted-foreground">
                          {lead.message}
                        </p>
                      )}
                    </div>
                    <time
                      className="shrink-0 text-meta text-muted-foreground"
                      dateTime={lead.createdAt.toISOString()}
                    >
                      {lead.createdAt.toLocaleString("bg-BG", {
                        timeZone: "Europe/Sofia",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <nav
          aria-label="Страници със запитвания"
          className="flex items-center justify-between"
        >
          <Link
            className="text-meta underline underline-offset-4"
            href="/dealer/leads"
          >
            Първа страница
          </Link>
          {result.nextCursor && (
            <Button asChild variant="outline">
              <Link href={`/dealer/leads?${nextQuery}`}>
                Следващи запитвания
              </Link>
            </Button>
          )}
        </nav>
      </main>
    </>
  );
}
