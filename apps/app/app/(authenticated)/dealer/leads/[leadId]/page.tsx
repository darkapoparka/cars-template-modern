import { getDealerLeadDetail } from "@repo/database/dealer-leads";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  canAssignDealerLeads,
  canChangeDealerLead,
  dealerLeadStatuses,
} from "@repo/marketplace/lead-workflow";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDealerOrganizationActor } from "../../actor";
import { updateDealerLeadAction } from "../actions";
import {
  getDealerLeadIntentLabel,
  getDealerLeadStatusLabel,
} from "../dealer-lead-labels";
import { LeadSubmitButton } from "../lead-submit-button";

export const metadata: Metadata = {
  title: "Клиентско запитване",
  robots: { index: false, follow: false },
};
const statusMessages: Record<string, string> = {
  saved: "Промените са запазени.",
  conflict:
    "Запитването е променено от друг служител. Прегледайте актуалните данни и опитайте отново.",
  unavailable:
    "Промените не са запазени. Проверете правата си и опитайте отново.",
};
const auditLabels: Record<string, string> = {
  "lead.created": "Запитването е получено",
  "lead.updated": "Статусът или отговорникът е променен",
};
const inputClass = "h-10 w-full rounded-md border bg-background px-3 text-body";
const dateLabel = (date: Date) =>
  date.toLocaleString("bg-BG", {
    timeZone: "Europe/Sofia",
    dateStyle: "medium",
    timeStyle: "short",
  });

export default async function DealerLeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const actor = await requireDealerOrganizationActor();
  const { leadId } = await params;
  if (!leadId || leadId.length > 128) {
    notFound();
  }
  const detail = await getDealerLeadDetail(actor, leadId);
  if (!detail) {
    notFound();
  }
  const { lead, events, member, members } = detail;
  const { state } = await searchParams;
  const message = state ? statusMessages[state] : undefined;
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 lg:p-6">
      <Link
        className="w-fit text-meta underline underline-offset-4"
        href="/dealer/leads"
      >
        Назад към запитванията
      </Link>
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-semibold text-page-title tracking-heading">
            {lead.buyerName ?? "Клиентско запитване"}
          </h1>
          <Badge variant="secondary">
            {getDealerLeadStatusLabel(lead.status)}
          </Badge>
        </div>
        <p className="mt-2 text-meta text-muted-foreground">
          {lead.listing?.title ?? "Общо запитване"} ·{" "}
          {dateLabel(lead.createdAt)}
        </p>
      </header>
      {message && (
        <output className="rounded-lg border bg-control p-4 text-body">
          {message}
        </output>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section
          aria-label="Данни за запитването"
          className="rounded-xl border bg-card p-5"
        >
          <h2 className="font-semibold text-section-title">Запитване</h2>
          {lead.intent && (
            <p className="mt-2 text-meta text-muted-foreground">
              {getDealerLeadIntentLabel(lead.intent)}
            </p>
          )}
          {member.role === "viewer" ? (
            <p className="mt-4 text-muted-foreground">
              Личните данни са скрити за тази роля.
            </p>
          ) : (
            <>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-meta text-muted-foreground">Телефон</dt>
                  <dd className="mt-1 break-all">
                    {lead.phone ?? "Не е посочен"}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-muted-foreground">Имейл</dt>
                  <dd className="mt-1 break-all">
                    {lead.email ?? "Не е посочен"}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 whitespace-pre-wrap break-words text-body">
                {lead.message ?? "Няма допълнително съобщение."}
              </p>
            </>
          )}
        </section>
        {member.role !== "viewer" && (
          <section
            aria-label="Управление на запитването"
            className="rounded-xl border bg-card p-5"
          >
            <h2 className="font-semibold text-section-title">Обработка</h2>
            <form
              action={updateDealerLeadAction}
              className="mt-4 flex flex-col gap-4"
            >
              <input name="leadId" type="hidden" value={lead.id} />
              <input
                name="expectedUpdatedAt"
                type="hidden"
                value={lead.updatedAt.toISOString()}
              />
              <label className="flex flex-col gap-2 text-meta">
                Статус
                <select
                  className={inputClass}
                  defaultValue={lead.status}
                  name="status"
                >
                  {dealerLeadStatuses
                    .filter((status) =>
                      canChangeDealerLead({
                        role: member.role,
                        memberId: member.id,
                        currentAssigneeId: lead.assignedDealerMemberId,
                        nextAssigneeId: lead.assignedDealerMemberId,
                        currentStatus: lead.status,
                        nextStatus: status,
                      })
                    )
                    .map((status) => (
                      <option key={status} value={status}>
                        {getDealerLeadStatusLabel(status)}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-meta">
                Отговорник
                <select
                  className={inputClass}
                  defaultValue={lead.assignedDealerMemberId ?? ""}
                  name="assignedMemberId"
                >
                  <option value="">Без отговорник</option>
                  {canAssignDealerLeads(member.role) ? (
                    members.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.account.sellerProfile?.displayName ??
                          `Член ${item.id.slice(-6)}`}
                        {item.id === member.id ? " (Вие)" : ""}
                      </option>
                    ))
                  ) : (
                    <option value={member.id}>Вие</option>
                  )}
                </select>
              </label>
              <LeadSubmitButton />
            </form>
          </section>
        )}
      </div>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold text-section-title">История</h2>
        <p className="mt-1 text-meta text-muted-foreground">
          Последните 50 събития. Лични данни не се записват в тази история.
        </p>
        <ol className="mt-4 divide-y">
          {events.map((event) => (
            <li
              className="flex flex-wrap justify-between gap-2 py-3 text-meta"
              key={event.id}
            >
              <span>{auditLabels[event.action] ?? "Събитието е записано"}</span>
              <time
                className="text-muted-foreground"
                dateTime={event.createdAt.toISOString()}
              >
                {dateLabel(event.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
