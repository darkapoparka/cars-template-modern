import { getKybAdminReviewCase } from "@repo/database/organization-verification";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  ArrowLeftIcon,
  Building2Icon,
  CheckCircle2Icon,
  FileCheck2Icon,
  HistoryIcon,
  ScanSearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import {
  recordKybReviewDecisionAction,
  transitionKybVerificationGrantAction,
} from "../actions";
import { requireKybAdminAuthorization } from "../authorization";

export const metadata: Metadata = {
  title: "Преглед на проверка",
  description: "Преглед на проверка на организация.",
};

const notices: Readonly<
  Record<string, { detail: string; success?: boolean; title: string }>
> = {
  decision_approved: {
    detail:
      "Случаят е одобрен и е записано ограничено във времето разрешение след проверка.",
    success: true,
    title: "Организацията е одобрена",
  },
  decision_conflict: {
    detail:
      "Случаят, правомощията на проверяващия или конфликтното състояние на организацията са променени. Не е записано решение.",
    title: "Състоянието на прегледа е променено",
  },
  decision_failed: {
    detail:
      "Решението не премина проверките на правилата или записването. Не е отчетено одобрение.",
    title: "Решението не е записано",
  },
  decision_needs_information: {
    detail: "Заявката за информация и причината са записани по случая.",
    success: true,
    title: "Поискана е информация",
  },
  decision_rejected: {
    detail: "Отказът и причината са записани по случая.",
    success: true,
    title: "Организацията е отхвърлена",
  },
  grant_conflict: {
    detail:
      "Разрешението, правомощията на проверяващия, валидността или конфликтното състояние са променени. Не е записан преход.",
    title: "Състоянието на разрешението е променено",
  },
  grant_failed: {
    detail:
      "Преходът на разрешението не премина проверките на правилата или записването.",
    title: "Разрешението не е обновено",
  },
  grant_updated: {
    detail:
      "Преходът на разрешението след проверка и одитното събитие са записани.",
    success: true,
    title: "Разрешението е обновено",
  },
};

const ReviewNotice = ({
  notice,
}: {
  readonly notice?: { detail: string; success?: boolean; title: string };
}) => {
  if (!notice) {
    return null;
  }

  const Icon = notice.success ? CheckCircle2Icon : ShieldAlertIcon;
  return (
    <Alert variant={notice.success ? "default" : "destructive"}>
      <Icon />
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.detail}</AlertDescription>
    </Alert>
  );
};

const translatedLabels: Readonly<Record<string, string>> = {
  accepted: "Приет",
  active: "Активен",
  approved: "Одобрен",
  completed: "Завършен",
  expired: "Изтекъл",
  failed: "Неуспешен",
  government: "Държавна организация",
  high: "Висок",
  infected: "Заразен",
  low: "Нисък",
  manual_review: "Ръчен преглед",
  medium: "Среден",
  needs_information: "Нужна е информация",
  nonprofit: "ЮЛНЦ",
  partnership: "Съдружие",
  pending: "Изчаква",
  private_company: "Частно дружество",
  provider_pending: "Очаква доставчик",
  public_company: "Публично дружество",
  rejected: "Отхвърлен",
  revoked: "Отнет",
  scanning: "Сканира се",
  sole_proprietor: "Едноличен търговец",
  suspended: "Спрян",
  verified: "Проверен",
};

const label = (value: string) => {
  const translated = translatedLabels[value];
  if (translated) {
    return translated;
  }
  const text = value.replaceAll("_", " ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

const formatDate = (value?: Date | null) =>
  value
    ? new Intl.DateTimeFormat("bg-BG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(value)
    : "Няма запис";

const formatBytes = (value?: number | null) => {
  if (!value) {
    return "Размерът не е проверен";
  }
  return value < 1024 * 1024
    ? `${(value / 1024).toFixed(1)} KiB`
    : `${(value / (1024 * 1024)).toFixed(1)} MiB`;
};

const statusVariant = (status?: string | null) => {
  if (
    ["accepted", "active", "approved", "completed", "verified"].includes(
      status ?? ""
    )
  ) {
    return "success" as const;
  }
  if (
    ["expired", "infected", "rejected", "revoked", "suspended"].includes(
      status ?? ""
    )
  ) {
    return "destructive" as const;
  }
  if (
    ["manual_review", "pending", "provider_pending", "scanning"].includes(
      status ?? ""
    )
  ) {
    return "info" as const;
  }
  return "warning" as const;
};

const reasonOptions = {
  approved: [
    ["documents_accepted", "Документите са приети"],
    ["identity_confirmed", "Самоличността е потвърдена"],
    ["registry_match", "Съвпадение с регистъра"],
    ["low_risk", "Нисък риск"],
  ],
  needs_information: [
    ["additional_documents_required", "Нужни са допълнителни документи"],
    ["document_unreadable", "Документът не се чете"],
    ["evidence_inconsistent", "Несъответстващи доказателства"],
  ],
  rejected: [
    ["identity_mismatch", "Несъответствие на самоличността"],
    ["registry_mismatch", "Несъответствие с регистъра"],
    ["document_invalid", "Невалиден документ"],
    ["organization_unverifiable", "Организацията не може да бъде проверена"],
    ["policy_violation", "Нарушение на правилата"],
  ],
} as const;

const decisionCopy = {
  approved: {
    action: "Одобряване и издаване на разрешение",
    title: "Одобряване на организацията",
    variant: "default",
  },
  needs_information: {
    action: "Изискване на информация",
    title: "Изискване на информация",
    variant: "outline",
  },
  rejected: {
    action: "Записване на отказа",
    title: "Отхвърляне на организацията",
    variant: "destructive",
  },
} as const;

const riskVariant = (riskLevel?: string | null) => {
  if (riskLevel === "high") {
    return "destructive" as const;
  }
  if (riskLevel === "low") {
    return "success" as const;
  }
  return "warning" as const;
};

const DecisionForm = ({
  expectedCaseVersion,
  kybCaseId,
  outcome,
}: {
  readonly expectedCaseVersion: number;
  readonly kybCaseId: string;
  readonly outcome: keyof typeof reasonOptions;
}) => {
  const copy = decisionCopy[outcome];

  return (
    <form
      action={recordKybReviewDecisionAction}
      className="space-y-3 rounded-lg border bg-card p-4"
    >
      <input
        name="expectedCaseVersion"
        type="hidden"
        value={expectedCaseVersion}
      />
      <input name="kybCaseId" type="hidden" value={kybCaseId} />
      <input name="outcome" type="hidden" value={outcome} />
      <div>
        <h3 className="font-semibold text-sm">{copy.title}</h3>
        <p className="mt-1 text-muted-foreground text-xs">
          Това записва решение от прегледа и събитие за проверка, без да променя
          историята.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${outcome}-reason`}>Причина</Label>
        <select
          className="h-9 w-full rounded-md border bg-control px-3 text-sm"
          id={`${outcome}-reason`}
          name="reasonCode"
          required
        >
          {reasonOptions[outcome].map(([value, optionLabel]) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </select>
      </div>
      {outcome === "approved" ? (
        <div className="space-y-2">
          <Label htmlFor="approval-validity">Валидност на разрешението</Label>
          <select
            className="h-9 w-full rounded-md border bg-control px-3 text-sm"
            defaultValue="365"
            id="approval-validity"
            name="validityDays"
            required
          >
            <option value="30">30 дни</option>
            <option value="90">90 дни</option>
            <option value="365">Максимум 365 дни</option>
          </select>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor={`${outcome}-note`}>
          Бележка от проверяващия (незадължително)
        </Label>
        <Textarea
          id={`${outcome}-note`}
          maxLength={2000}
          name="reviewerNote"
          placeholder="Добавете кратък контекст, свързан с правилата."
          rows={3}
        />
      </div>
      <label className="flex items-start gap-2 rounded-md bg-control/60 p-3 text-sm">
        <input
          className="mt-0.5"
          name="confirmDecision"
          required
          type="checkbox"
        />
        <span>
          Прегледах наличните резултати от доставчиците и метаданните на
          документите за това решение.
        </span>
      </label>
      <Button className="w-full" type="submit" variant={copy.variant}>
        {copy.action}
      </Button>
    </form>
  );
};

const GrantActionForm = ({
  expectedVersion,
  grantId,
  kybCaseId,
  label: actionLabel,
  nextStatus,
  options,
}: {
  readonly expectedVersion: number;
  readonly grantId: string;
  readonly kybCaseId: string;
  readonly label: string;
  readonly nextStatus: "active" | "revoked" | "suspended";
  readonly options: readonly (readonly [string, string])[];
}) => (
  <form
    action={transitionKybVerificationGrantAction}
    className="space-y-3 border-t pt-3"
  >
    <input name="expectedVersion" type="hidden" value={expectedVersion} />
    <input name="grantId" type="hidden" value={grantId} />
    <input name="kybCaseId" type="hidden" value={kybCaseId} />
    <input name="nextStatus" type="hidden" value={nextStatus} />
    <Label htmlFor={`${grantId}-${nextStatus}`}>Причина: {actionLabel}</Label>
    <select
      className="h-9 w-full rounded-md border bg-control px-3 text-sm"
      id={`${grantId}-${nextStatus}`}
      name="reasonCode"
      required
    >
      {options.map(([value, optionLabel]) => (
        <option key={value} value={value}>
          {optionLabel}
        </option>
      ))}
    </select>
    <label className="flex items-start gap-2 text-xs">
      <input
        className="mt-0.5"
        name="confirmDecision"
        required
        type="checkbox"
      />
      <span>
        Потвърждавам този преход на разрешението и одитната му причина.
      </span>
    </label>
    <Button
      className="w-full"
      type="submit"
      variant={nextStatus === "revoked" ? "destructive" : "outline"}
    >
      {actionLabel}
    </Button>
  </form>
);

const VerificationCasePage = async ({
  params,
  searchParams,
}: {
  readonly params: Promise<{ caseId: string }>;
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const authorization = await requireKybAdminAuthorization();
  const [route, query] = await Promise.all([params, searchParams]);
  const review = await getKybAdminReviewCase({
    authorization,
    kybCaseId: route.caseId,
  });
  if (!review) {
    notFound();
  }
  const notice = query.state ? notices[query.state] : undefined;
  const currentGrant = review.dealerOrg.currentVerificationGrant;
  const grant = currentGrant?.kybCaseId === review.id ? currentGrant : null;
  const canDecide = review.status === "manual_review";

  return (
    <>
      <Header
        page="Преглед на проверка"
        pages={["AutoMarket", "Администрация", "Доверие"]}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <ReviewNotice notice={notice} />

        <section className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Button asChild className="mb-3 -ml-3" variant="ghost">
                <Link href="/admin/trust">
                  <ArrowLeftIcon />
                  Назад към опашката
                </Link>
              </Button>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Building2Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Опит {review.attempt} · {review.policyVersion}
                  </p>
                  <h1 className="mt-1 truncate font-semibold text-xl">
                    {review.legalEntity.tradingName ||
                      review.dealerOrg.displayName}
                  </h1>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {review.legalEntity.legalName} · изпратено на{" "}
                    {formatDate(review.submittedAt)}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant={statusVariant(review.status)}>
              {label(review.status)}
            </Badge>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="font-semibold text-sm">Юридическо лице</h2>
              </div>
              <dl className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Регистрирано име", review.legalEntity.legalName],
                  [
                    "Търговско име",
                    review.legalEntity.tradingName || "Няма запис",
                  ],
                  [
                    "Вид на юридическото лице",
                    label(review.legalEntity.entityType),
                  ],
                  [
                    "Регистрация",
                    `${review.legalEntity.registrationCountryCode} · ${review.legalEntity.registrationNumber}`,
                  ],
                  [
                    "Адрес на регистрация",
                    [
                      review.legalEntity.addressLine1,
                      review.legalEntity.addressLine2,
                      review.legalEntity.city,
                      review.legalEntity.region,
                      review.legalEntity.postalCode,
                      review.legalEntity.addressCountryCode,
                    ]
                      .filter(Boolean)
                      .join(", "),
                  ],
                  [
                    "Учредено",
                    review.legalEntity.incorporationDate
                      ? formatDate(review.legalEntity.incorporationDate)
                      : "Няма запис",
                  ],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className="text-muted-foreground text-xs">{term}</dt>
                    <dd className="mt-1 text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <div className="flex items-center gap-2">
                  <FileCheck2Icon className="size-4" />
                  <h2 className="font-semibold text-sm">
                    Метаданни на документите
                  </h2>
                </div>
                <p className="mt-1 text-muted-foreground text-xs">
                  Тук не се показват частни байтове, ключове за съхранение,
                  хешове, данни за криптиране, тайни на доставчици или URL
                  адреси за изтегляне.
                </p>
              </div>
              <div className="divide-y">
                {review.documents.length ? (
                  review.documents.map((document) => (
                    <div
                      className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={document.id}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {label(document.kind)}
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {document.mimeType} ·{" "}
                          {formatBytes(document.verifiedByteSize)} · записано на{" "}
                          {formatDate(document.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant(document.status)}>
                          {label(document.status)}
                        </Badge>
                        {document.legalHold ? (
                          <Badge variant="warning">Правно задържане</Badge>
                        ) : null}
                        {document.purgedAt ? (
                          <Badge variant="secondary">Изтрит</Badge>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground text-sm">
                    Няма записани метаданни за документи.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <div className="flex items-center gap-2">
                  <ScanSearchIcon className="size-4" />
                  <h2 className="font-semibold text-sm">
                    Проверки от доставчици
                  </h2>
                </div>
              </div>
              <div className="divide-y">
                {review.providerChecks.length ? (
                  review.providerChecks.map((check) => (
                    <div
                      className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                      key={check.id}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {label(check.checkType)}
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          Заявено на {formatDate(check.requestedAt)} · завършено
                          на {formatDate(check.completedAt)}
                        </p>
                        {check.normalizedResultCode ? (
                          <p className="mt-1 text-xs">
                            Резултат: {label(check.normalizedResultCode)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Badge variant={statusVariant(check.status)}>
                          {label(check.status)}
                        </Badge>
                        <Badge variant={riskVariant(check.riskLevel)}>
                          {check.riskLevel
                            ? `Риск: ${label(check.riskLevel)}`
                            : "Неизвестен риск"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-muted-foreground text-sm">
                    Няма записани проверки от доставчици.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="size-4" />
                  <h2 className="font-semibold text-sm">
                    История на решенията и събитията
                  </h2>
                </div>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Решения</h3>
                  {review.reviewDecisions.length ? (
                    review.reviewDecisions.map((decision) => (
                      <div
                        className="rounded-md bg-control/60 p-3"
                        key={decision.id}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={statusVariant(decision.outcome)}>
                            {label(decision.outcome)}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {formatDate(decision.decidedAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs">
                          {decision.reasonCodes.map(label).join(", ")}
                        </p>
                        {decision.reviewerNote ? (
                          <p className="mt-2 text-muted-foreground text-xs">
                            {decision.reviewerNote}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Няма записано решение.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Събития</h3>
                  {review.events.slice(0, 20).map((event) => (
                    <div className="border-b pb-3 text-sm" key={event.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {label(event.eventType)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(event.occurredAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs">
                        Извършител: {label(event.actorType)}
                        {event.reasonCodes.length
                          ? ` · ${event.reasonCodes.map(label).join(", ")}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            {canDecide ? (
              <>
                <DecisionForm
                  expectedCaseVersion={review.version}
                  kybCaseId={review.id}
                  outcome="needs_information"
                />
                <DecisionForm
                  expectedCaseVersion={review.version}
                  kybCaseId={review.id}
                  outcome="rejected"
                />
                <DecisionForm
                  expectedCaseVersion={review.version}
                  kybCaseId={review.id}
                  outcome="approved"
                />
              </>
            ) : (
              <Alert>
                <ShieldCheckIcon />
                <AlertTitle>Решението е записано</AlertTitle>
                <AlertDescription>
                  Този случай е със статус „{label(review.status)}“. Формулярите
                  са достъпни само при ръчен преглед.
                </AlertDescription>
              </Alert>
            )}

            <section className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-sm">
                  Разрешение след проверка
                </h2>
                {grant ? (
                  <Badge variant={statusVariant(grant.status)}>
                    {label(grant.status)}
                  </Badge>
                ) : null}
              </div>
              {grant ? (
                <p className="mt-2 text-muted-foreground text-xs">
                  Валидно от {formatDate(grant.validFrom)} до{" "}
                  {formatDate(grant.validUntil)}. Версия {grant.version}.
                </p>
              ) : (
                <p className="mt-2 text-muted-foreground text-sm">
                  Няма записано текущо разрешение.
                </p>
              )}
              {grant?.status === "active" ? (
                <GrantActionForm
                  expectedVersion={grant.version}
                  grantId={grant.id}
                  kybCaseId={review.id}
                  label="Спиране на разрешението"
                  nextStatus="suspended"
                  options={[
                    ["compliance_review", "Преглед за съответствие"],
                    ["legal_hold", "Правно задържане"],
                    ["risk_change", "Промяна на риска"],
                  ]}
                />
              ) : null}
              {grant?.status === "suspended" ? (
                <GrantActionForm
                  expectedVersion={grant.version}
                  grantId={grant.id}
                  kybCaseId={review.id}
                  label="Повторно активиране"
                  nextStatus="active"
                  options={[["review_cleared", "Прегледът е приключен"]]}
                />
              ) : null}
              {grant &&
              (grant.status === "active" || grant.status === "suspended") ? (
                <GrantActionForm
                  expectedVersion={grant.version}
                  grantId={grant.id}
                  kybCaseId={review.id}
                  label="Отнемане на разрешението"
                  nextStatus="revoked"
                  options={[
                    ["authorization_revoked", "Разрешението е отнето"],
                    ["fraud_confirmed", "Потвърдена измама"],
                    ["organization_closed", "Организацията е закрита"],
                  ]}
                />
              ) : null}
            </section>
          </aside>
        </div>
      </main>
    </>
  );
};

export default VerificationCasePage;
