import { database } from "@repo/database";
import { getActiveListingQuotaView } from "@repo/database/commerce";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { type CommercePlanKey, commercePlanCatalog } from "@repo/marketplace";
import {
  CalendarClockIcon,
  CreditCardIcon,
  PackageCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { requireDealerOrganizationActor } from "../actor";

export const metadata: Metadata = {
  title: "План и плащания",
  description: "План, плащания и абонамент за дилъра.",
};

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
  }).format(value);

const billingAccountStatusLabels: Readonly<Record<string, string>> = {
  active: "Активен",
  disabled: "Деактивиран",
  past_due: "Просрочен",
  pending: "Изчаква потвърждение",
};

const subscriptionStatusLabels: Readonly<Record<string, string>> = {
  active: "Активен",
  canceled: "Прекратен",
  incomplete: "Незавършен",
  past_due: "Просрочен",
  paused: "На пауза",
  trialing: "Пробен период",
};

const getPlanLabel = (planKey?: string): string =>
  planKey
    ? (commercePlanCatalog[planKey as CommercePlanKey]?.label.bg ??
      "Конфигуриран план")
    : "Няма план";

const currentSubscriptionStatuses = [
  "active",
  "past_due",
  "paused",
  "trialing",
] as const;

const isCurrentSubscriptionStatus = (
  status: string
): status is (typeof currentSubscriptionStatuses)[number] =>
  currentSubscriptionStatuses.some((candidate) => candidate === status);

const getRenewalLabel = ({
  cancelAtPeriodEnd,
  status,
}: {
  cancelAtPeriodEnd: boolean;
  status: string;
}): string => {
  if (cancelAtPeriodEnd) {
    return "Ще бъде прекратен в края на периода";
  }

  if (status === "past_due") {
    return "Изчаква уреждане на плащането";
  }

  if (status === "paused") {
    return "На пауза до повторно активиране";
  }

  if (status === "trialing") {
    return "Планирано след пробния период";
  }

  return "Планирано за следващ период";
};

const BillingMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCardIcon;
  label: string;
  value: string;
}) => (
  <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4 md:last:col-span-1 last:min-[360px]:col-span-2">
    <div className="mb-3 flex items-start justify-between gap-3">
      <span className="min-w-0 text-muted-foreground text-sm">{label}</span>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
    <p className="break-words font-semibold text-xl sm:text-2xl">{value}</p>
  </div>
);

const DealerBillingPage = async () => {
  const actor = await requireDealerOrganizationActor();
  const [billingAccount, quota] = await Promise.all([
    database.dealerBillingAccount.findUnique({
      select: {
        defaultCurrency: true,
        status: true,
        subscriptions: {
          orderBy: { updatedAt: "desc" },
          select: {
            cancelAtPeriodEnd: true,
            currentPeriodEnd: true,
            planKey: true,
            status: true,
          },
          take: 1,
          where: {
            status: { in: [...currentSubscriptionStatuses] },
          },
        },
      },
      where: { dealerOrgId: actor.dealerOrgId },
    }),
    getActiveListingQuotaView({
      id: actor.dealerOrgId,
      kind: "dealer_org",
    }),
  ]);
  const subscription = billingAccount?.subscriptions.find((candidate) =>
    isCurrentSubscriptionStatus(candidate.status)
  );
  const billingStatus = billingAccount
    ? (billingAccountStatusLabels[billingAccount.status] ??
      "Неизвестно състояние")
    : "Не е свързан";
  const subscriptionStatus = subscription
    ? (subscriptionStatusLabels[subscription.status] ?? "Неизвестно състояние")
    : "Няма абонамент";
  const resolvedPlanKey =
    quota.entitlement.plan?.key ?? subscription?.planKey ?? undefined;
  const dealerPlans = (
    ["dealer-starter", "dealer-growth", "dealer-scale"] as const
  ).map((key) => commercePlanCatalog[key]);

  return (
    <>
      <Header page="План и плащания" pages={["AutoMarket", "Дилър"]} />
      <main className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <section
          aria-labelledby="billing-title"
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <h1 className="font-semibold text-xl" id="billing-title">
              План и плащания
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
              Реалното състояние на платежния профил и абонамента на
              организацията.
            </p>
          </div>
          <Button
            asChild
            className="h-10 w-full rounded-lg sm:w-auto"
            variant="secondary"
          >
            <Link href="/dealer/promotions">Промотиране</Link>
          </Button>
        </section>

        <section
          aria-label="Обобщение за плащанията"
          className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3 min-[360px]:grid-cols-2"
        >
          <BillingMetric
            icon={PackageCheckIcon}
            label="Текущ план"
            value={getPlanLabel(resolvedPlanKey)}
          />
          <BillingMetric
            icon={CalendarClockIcon}
            label="Състояние на абонамента"
            value={subscriptionStatus}
          />
          <BillingMetric
            icon={CreditCardIcon}
            label="Платежен профил"
            value={billingStatus}
          />
        </section>

        <Alert id="billing-provider-note">
          <CreditCardIcon />
          <AlertTitle>Плащанията още не са достъпни</AlertTitle>
          <AlertDescription>
            Промяната на план, плащането, подновяването и порталът за фактури
            остават изключени. Настройка на намерение без проверен projection
            адаптер не активира тази възможност.
          </AlertDescription>
        </Alert>

        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-base">
                  План и лимит на инвентара
                </h2>
                <p className="mt-1 text-muted-foreground text-xs">
                  Само активните обяви използват квотата. Черновите и обявите на
                  пауза не я използват.
                </p>
              </div>
              <Badge
                variant={quota.decision.overage > 0 ? "warning" : "secondary"}
              >
                {quota.decision.usage} / {quota.decision.limit} активни
              </Badge>
            </div>
            {quota.decision.overage > 0 ? (
              <Alert className="mt-4">
                <PackageCheckIcon />
                <AlertTitle>
                  Над лимита с {quota.decision.overage} обяви
                </AlertTitle>
                <AlertDescription>
                  Съществуващите обяви не се изтриват. Ново активиране е спряно,
                  докато използването не падне под лимита или не бъде потвърден
                  друг план.
                </AlertDescription>
              </Alert>
            ) : null}
            {subscription ? (
              <dl className="mt-4 grid gap-3 text-sm min-[360px]:grid-cols-2">
                <div className="min-w-0 rounded-lg bg-secondary/60 p-3">
                  <dt className="text-muted-foreground">План</dt>
                  <dd className="mt-1 break-words font-medium">
                    {getPlanLabel(subscription.planKey)}
                  </dd>
                </div>
                <div className="min-w-0 rounded-lg bg-secondary/60 p-3">
                  <dt className="text-muted-foreground">Състояние</dt>
                  <dd className="mt-1">
                    <Badge className="max-w-full whitespace-normal rounded-full">
                      {subscriptionStatus}
                    </Badge>
                  </dd>
                </div>
                <div className="min-w-0 rounded-lg bg-secondary/60 p-3">
                  <dt className="text-muted-foreground">
                    Край на текущия период
                  </dt>
                  <dd className="mt-1 break-words font-medium">
                    {subscription.currentPeriodEnd
                      ? formatDate(subscription.currentPeriodEnd)
                      : "Не е зададен"}
                  </dd>
                </div>
                <div className="min-w-0 rounded-lg bg-secondary/60 p-3">
                  <dt className="text-muted-foreground">Подновяване</dt>
                  <dd className="mt-1 break-words font-medium">
                    {getRenewalLabel(subscription)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
                <span>За тази организация няма записан абонамент.</span>{" "}
                <span>
                  Достъп може да съществува само чрез отделен, одитируем
                  entitlement grant.
                </span>
              </p>
            )}
          </div>

          <aside className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
            <h2 className="font-semibold text-base">Платежен профил</h2>
            {billingAccount ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-muted-foreground">Състояние</dt>
                  <dd className="break-words font-medium">{billingStatus}</dd>
                </div>
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-muted-foreground">Валута</dt>
                  <dd className="font-medium">
                    {billingAccount.defaultCurrency}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-muted-foreground text-sm">
                Няма свързан платежен профил. Не се показват примерни карти,
                разходи или фактури.
              </p>
            )}
            <Button
              aria-describedby="billing-provider-note"
              className="mt-5 h-10 w-full rounded-lg"
              disabled
              type="button"
              variant="outline"
            >
              Платежният портал не е наличен
            </Button>
          </aside>
        </section>

        <section
          aria-labelledby="plan-hypotheses-title"
          className="rounded-lg border border-border bg-card p-3 sm:p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2
                className="font-semibold text-base"
                id="plan-hypotheses-title"
              >
                Планови хипотези за валидиране
              </h2>
              <p className="mt-1 max-w-3xl text-muted-foreground text-sm">
                Лимитите са продуктова хипотеза, а не публикувана ценова оферта.
                Цени няма да бъдат показвани преди интервюта с дилъри и проверка
                на икономиката на доставчика.
              </p>
            </div>
            <Badge className="w-fit" variant="outline">
              Експеримент
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {dealerPlans.map((plan) => (
              <article
                className="rounded-lg bg-secondary/55 p-3"
                key={plan.key}
              >
                <h3 className="font-semibold">{plan.label.bg} · хипотеза</h3>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Активни обяви</dt>
                    <dd className="font-medium">
                      {plan.entitlements.activeListingLimit}
                      {plan.entitlements.negotiatedCapacityAvailable ? "+" : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Места в екипа</dt>
                    <dd className="font-medium">
                      {plan.entitlements.seatLimit}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      AI кредити / месец
                    </dt>
                    <dd className="font-medium">
                      {plan.entitlements.aiCreditsPerPeriod}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default DealerBillingPage;
