import { database } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { formatMoney } from "@repo/marketplace";
import { formatVehicleLocation } from "@repo/marketplace-ui";
import {
  BarChart3Icon,
  CarIcon,
  MessageSquareIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { Header } from "../../components/header";
import { requireDealerOrganizationActor } from "../actor";

export const metadata: Metadata = {
  title: "Анализи за дилъра",
  description: "Анализи на представянето в AutoMarket.",
};

const leadStages = [
  { label: "Нови", statuses: ["new"] },
  { label: "Прегледани", statuses: ["viewed"] },
  { label: "С осъществен контакт", statuses: ["contacted"] },
  { label: "Квалифицирани", statuses: ["qualified"] },
  { label: "Приключени", statuses: ["won", "lost", "closed"] },
  { label: "Спам", statuses: ["spam"] },
] as const;

const AnalyticsMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CarIcon;
  label: string;
  value: string;
}) => (
  <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
    <div className="mb-3 flex items-start justify-between gap-3">
      <span className="min-w-0 text-muted-foreground text-sm">{label}</span>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
    <p className="break-words font-semibold text-2xl">{value}</p>
  </div>
);

const DealerAnalyticsPage = async () => {
  const actor = await requireDealerOrganizationActor();
  const [activeInventoryCount, averagePrice, topInventory, leadGroups] =
    await Promise.all([
      database.marketplaceListing.count({
        where: {
          dealerOrgId: actor.dealerOrgId,
          deletedAt: null,
          status: "active",
        },
      }),
      database.marketplaceListing.aggregate({
        _avg: { priceAmountMinor: true },
        where: {
          dealerOrgId: actor.dealerOrgId,
          deletedAt: null,
          priceCurrency: "BGN",
          status: "active",
        },
      }),
      database.marketplaceListing.findMany({
        orderBy: [{ leads: { _count: "desc" } }, { updatedAt: "desc" }],
        select: {
          _count: { select: { leads: true } },
          id: true,
          locationCity: true,
          locationCountry: true,
          locationRegion: true,
          priceAmountMinor: true,
          priceCurrency: true,
          title: true,
        },
        take: 4,
        where: {
          dealerOrgId: actor.dealerOrgId,
          deletedAt: null,
          status: "active",
        },
      }),
      database.lead.groupBy({
        _count: { _all: true },
        by: ["status"],
        where: { dealerOrgId: actor.dealerOrgId, deletedAt: null },
      }),
    ]);
  const averageBgnPrice = averagePrice._avg.priceAmountMinor
    ? formatMoney(
        {
          amount: Math.round(averagePrice._avg.priceAmountMinor / 100),
          currency: "BGN",
        },
        "bg"
      )
    : "Няма данни";
  const leadCountByStatus = new Map(
    leadGroups.map((group) => [group.status, group._count._all])
  );
  const leadCount = leadGroups.reduce(
    (total, group) => total + group._count._all,
    0
  );

  const summaryItems = [
    {
      icon: CarIcon,
      label: "Активен инвентар",
      value: String(activeInventoryCount),
    },
    {
      icon: MessageSquareIcon,
      label: "Общо запитвания",
      value: String(leadCount),
    },
    {
      icon: TrendingUpIcon,
      label: "Нови запитвания",
      value: String(leadCountByStatus.get("new") ?? 0),
    },
    {
      icon: BarChart3Icon,
      label: "Средна активна цена в лева",
      value: averageBgnPrice,
    },
  ];

  return (
    <>
      <Header page="Анализи" pages={["AutoMarket", "Дилър"]} />
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <section aria-labelledby="analytics-title">
          <h1 className="font-semibold text-xl" id="analytics-title">
            Анализи
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
            Актуални данни за инвентара и запитванията на тази организация.
          </p>
        </section>

        <section
          aria-label="Обобщение"
          className="grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3 min-[360px]:grid-cols-2"
        >
          {summaryItems.map((item) => (
            <AnalyticsMetric {...item} key={item.label} />
          ))}
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
            <h2 className="font-semibold text-base">Водещи активни обяви</h2>
            {topInventory.length ? (
              <div className="mt-4 space-y-3">
                {topInventory.map((listing) => (
                  <article
                    className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-secondary/40 p-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between"
                    key={listing.id}
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium text-sm">
                        {listing.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatVehicleLocation(
                          {
                            city: listing.locationCity,
                            country: listing.locationCountry,
                            region: listing.locationRegion ?? undefined,
                          },
                          "bg"
                        )}
                      </p>
                    </div>
                    <Badge
                      className="w-fit max-w-full whitespace-normal rounded-full"
                      variant="secondary"
                    >
                      {formatMoney(
                        {
                          amount: listing.priceAmountMinor / 100,
                          currency: listing.priceCurrency,
                        },
                        "bg"
                      )}
                    </Badge>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
                Няма активни обяви за анализ.
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
            <h2 className="font-semibold text-base">Етапи на запитванията</h2>
            {leadCount ? (
              <div className="mt-4 grid gap-2">
                {leadStages.map(({ label, statuses }) => {
                  const count = statuses.reduce(
                    (total, status) =>
                      total + (leadCountByStatus.get(status) ?? 0),
                    0
                  );

                  return (
                    <div
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm"
                      key={label}
                    >
                      <span>{label}</span>
                      <Badge className="rounded-full" variant="outline">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
                Все още няма получени запитвания.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default DealerAnalyticsPage;
