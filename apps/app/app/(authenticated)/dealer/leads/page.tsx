import { ensureDealerActor } from "@repo/database/accounts";
import { listDealerLeads } from "@repo/database/leads";
import { Badge } from "@repo/design-system/components/ui/badge";
import type { Metadata } from "next";
import { Header } from "../../components/header";
import { requireListingActor } from "../../sell/actor";
import {
  getDealerLeadIntentLabel,
  getDealerLeadStatusLabel,
} from "./dealer-lead-labels";

export const metadata: Metadata = {
  title: "Запитвания",
  description: "Запитвания към дилърската организация.",
};

const DealerLeadsPage = async () => {
  const actor = await requireListingActor();
  if (!(actor.clerkOrgId && actor.orgRole)) {
    throw new Error("Active dealer organization required");
  }
  const dealer = await ensureDealerActor({
    clerkOrgId: actor.clerkOrgId,
    clerkUserId: actor.clerkUserId,
    orgRole: actor.orgRole,
  });
  const leads = await listDealerLeads(dealer.dealerOrg.id);

  return (
    <>
      <Header page="Запитвания" pages={["AutoMarket", "Дилър"]} />
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <h1 className="sr-only">Запитвания</h1>
        <section className="grid gap-3">
          {leads.map((lead) => (
            <article
              className="rounded-lg border bg-card p-3 sm:p-4"
              key={lead.id}
            >
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-base">
                      {lead.buyerName ?? "Купувач"}
                    </h2>
                    <Badge>{getDealerLeadStatusLabel(lead.status)}</Badge>
                    {lead.intent && (
                      <Badge variant="secondary">
                        {getDealerLeadIntentLabel(lead.intent)}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm">
                    {lead.listing?.title ?? "Общо запитване"}
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {lead.message}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {lead.createdAt.toLocaleString("bg-BG")}
                </p>
              </div>
            </article>
          ))}
          {leads.length === 0 && (
            <p className="rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
              Все още няма запитвания.
            </p>
          )}
        </section>
      </main>
    </>
  );
};

export default DealerLeadsPage;
