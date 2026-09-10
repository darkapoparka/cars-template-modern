import { listKybAdminReviewQueue } from "@repo/database/organization-verification";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Building2Icon,
  FileCheck2Icon,
  ListChecksIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "../../components/header";
import { requireKybAdminAuthorization } from "./authorization";

export const metadata: Metadata = {
  title: "Опашка за проверки",
  description: "Административна опашка за проверка на организации.",
};

const notices: Readonly<Record<string, { detail: string; title: string }>> = {
  invalid_request: {
    detail: "Заявката за преглед е невалидна. Няма променен запис за доверие.",
    title: "Невалидна заявка за преглед",
  },
};

const formatDate = (value: Date | null) =>
  value
    ? new Intl.DateTimeFormat("bg-BG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(value)
    : "Няма запис";

const translatedLabels: Readonly<Record<string, string>> = {
  accepted: "Приет",
  approved: "Одобрен",
  failed: "Неуспешен",
  government: "Държавна организация",
  high: "Висок",
  low: "Нисък",
  manual_review: "Ръчен преглед",
  medium: "Среден",
  nonprofit: "ЮЛНЦ",
  partnership: "Съдружие",
  passed: "Успешен",
  pending: "Изчаква",
  private_company: "Частно дружество",
  public_company: "Публично дружество",
  rejected: "Отхвърлен",
  review_required: "Нужен преглед",
  sole_proprietor: "Едноличен търговец",
  unavailable: "Недостъпен",
};

const label = (value: string) => {
  const translated = translatedLabels[value];
  if (translated) {
    return translated;
  }
  const text = value.replaceAll("_", " ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

const riskVariant = (risk?: string | null) => {
  if (risk === "high") {
    return "destructive" as const;
  }
  if (risk === "low") {
    return "success" as const;
  }
  if (risk === "medium") {
    return "warning" as const;
  }
  return "secondary" as const;
};

const QueueMetric = ({
  icon: Icon,
  label: metricLabel,
  value,
}: {
  readonly icon: typeof ShieldCheckIcon;
  readonly label: string;
  readonly value: number;
}) => (
  <div className="rounded-lg border bg-card p-3 sm:p-4">
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-sm">{metricLabel}</span>
      <Icon className="size-4 text-muted-foreground" />
    </div>
    <p className="mt-3 font-semibold text-2xl">{value}</p>
  </div>
);

const TrustQueuePage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const authorization = await requireKybAdminAuthorization();
  const [queue, query] = await Promise.all([
    listKybAdminReviewQueue({ authorization, limit: 100 }),
    searchParams,
  ]);
  const notice = query.state ? notices[query.state] : undefined;
  const documentCount = queue.cases.reduce(
    (total, item) => total + item._count.documents,
    0
  );
  const highRiskCount = queue.cases.filter(
    (item) => item.providerChecks[0]?.riskLevel === "high"
  ).length;

  return (
    <>
      <Header
        page="Опашка за проверки"
        pages={["AutoMarket", "Администрация"]}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {notice ? (
          <Alert variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.detail}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
          <QueueMetric
            icon={ListChecksIcon}
            label="Очакват преглед"
            value={queue.total}
          />
          <QueueMetric
            icon={FileCheck2Icon}
            label="Документи"
            value={documentCount}
          />
          <div className="col-span-2 sm:col-span-1">
            <QueueMetric
              icon={ShieldAlertIcon}
              label="Проверки с висок риск"
              value={highRiskCount}
            />
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h1 className="font-semibold text-lg">Ръчна проверка</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Тук се показват само изпратените случаи в траен ръчен преглед.
              Конфликтите между проверяващи и активността на акаунта се
              проверяват повторно на ниво база данни.
            </p>
          </div>

          {queue.cases.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <ShieldCheckIcon className="mx-auto size-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">Няма чакащи случаи</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Няма подходящи случаи на организации за ръчен преглед.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {queue.cases.map((item) => {
                const providerCheck = item.providerChecks[0];
                return (
                  <article
                    className="rounded-lg border bg-card p-4"
                    key={item.id}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <Building2Icon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate font-semibold">
                              {item.legalEntity.tradingName ||
                                item.dealerOrg.displayName}
                            </h2>
                            <p className="truncate text-muted-foreground text-sm">
                              {item.legalEntity.legalName} ·{" "}
                              {label(item.legalEntity.entityType)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="info">Ръчен преглед</Badge>
                          <Badge variant="secondary">
                            {item._count.documents} документа
                          </Badge>
                          <Badge
                            variant={riskVariant(providerCheck?.riskLevel)}
                          >
                            {providerCheck?.riskLevel
                              ? `Риск: ${label(providerCheck.riskLevel)}`
                              : "Няма записан риск"}
                          </Badge>
                          {providerCheck ? (
                            <Badge variant="outline">
                              Проверка: {label(providerCheck.status)}
                            </Badge>
                          ) : null}
                        </div>
                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-muted-foreground text-xs">
                              Регистрация
                            </dt>
                            <dd>{item.legalEntity.registrationCountryCode}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground text-xs">
                              Изпратено
                            </dt>
                            <dd>{formatDate(item.submittedAt)}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground text-xs">
                              Последна заявка за проверка
                            </dt>
                            <dd>
                              {formatDate(providerCheck?.requestedAt ?? null)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <Button asChild className="w-full lg:w-auto">
                        <Link
                          href={`/admin/trust/${encodeURIComponent(item.id)}`}
                        >
                          Преглед на случая
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default TrustQueuePage;
