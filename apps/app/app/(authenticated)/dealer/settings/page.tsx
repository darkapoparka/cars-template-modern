import { getOrganizationVerificationSummary } from "@repo/database/organization-verification";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Building2Icon,
  CheckCircle2Icon,
  FileCheck2Icon,
  FileClockIcon,
  HardDriveUploadIcon,
  ShieldAlertIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { Header } from "../../components/header";
import { requireDealerOrganizationActor } from "../actor";
import { dealerProviderReadiness } from "../provider-adapters";
import {
  saveLegalEntityAction,
  startKybCaseAction,
  transitionKybCaseAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Настройки на дилъра",
  description: "Регистрация на организацията и готовност за KYB проверка.",
};

const notices: Readonly<Record<string, { detail: string; title: string }>> = {
  invalid_legal_entity: {
    detail:
      "Проверете задължителните полета за юридическо име, регистрация, адрес и ISO код на държавата.",
    title: "Данните за юридическото лице изискват внимание",
  },
  kyb_case_failed: {
    detail:
      "Проверката не можа да бъде стартирана. Записаните данни за юридическото лице не са променени.",
    title: "Проверката не е стартирана",
  },
  kyb_case_started: {
    detail: "За тази организация вече има отворена трайна проверка.",
    title: "Проверката е стартирана",
  },
  kyb_status_updated: {
    detail: "Проверката премина към следващото трайно състояние на процеса.",
    title: "Статусът на проверката е обновен",
  },
  kyb_transition_failed: {
    detail: "Този преход не е разрешен от текущото състояние на проверката.",
    title: "Статусът на проверката не е променен",
  },
  legal_entity_failed: {
    detail:
      "Юридическото лице не можа да бъде записано. Не е отчетен успешен резултат.",
    title: "Юридическото лице не е записано",
  },
  legal_entity_saved: {
    detail: "Трайният запис за юридическото лице е обновен.",
    title: "Юридическото лице е записано",
  },
  verification_conflict: {
    detail:
      "Този запис е променен от друга заявка. Прегледайте текущите стойности, преди да опитате отново.",
    title: "Текущите данни са променени",
  },
};

const formatDate = (value?: Date | null) =>
  value
    ? new Intl.DateTimeFormat("bg-BG", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
        year: "numeric",
      }).format(value)
    : "Няма запис";

const statusVariant = (status?: string) => {
  if (["accepted", "active", "approved", "verified"].includes(status ?? "")) {
    return "success" as const;
  }
  if (
    ["rejected", "expired", "suspended", "purge_dead_letter"].includes(
      status ?? ""
    )
  ) {
    return "destructive" as const;
  }
  return [
    "submitted",
    "provider_pending",
    "manual_review",
    "scanning",
  ].includes(status ?? "")
    ? ("info" as const)
    : ("warning" as const);
};

const translatedLabels: Readonly<Record<string, string>> = {
  accepted: "Приет",
  active: "Активен",
  approved: "Одобрен",
  awaiting_documents: "Очаква документи",
  cancelled: "Отменен",
  draft: "Чернова",
  expired: "Изтекъл",
  in_review: "В преглед",
  kyb_pending: "Очаква KYB",
  manual_review: "Ръчен преглед",
  needs_information: "Нужна е информация",
  not_started: "Не е стартиран",
  pending: "Изчаква",
  profile_incomplete: "Непълен профил",
  provider_pending: "Очаква доставчик",
  purge_dead_letter: "Неуспешно окончателно изтриване",
  purge_pending: "Очаква изтриване",
  purged: "Изтрит",
  quarantined: "Под карантина",
  ready_for_submission: "Готов за изпращане",
  registered: "Регистриран",
  rejected: "Отхвърлен",
  scanning: "Сканира се",
  submitted: "Изпратен",
  superseded: "Заменен",
  suspended: "Спрян",
  uploaded: "Качен",
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

const nextCaseAction = (status: string) => {
  if (status === "draft") {
    return {
      label: "Изискване на документи",
      nextStatus: "awaiting_documents",
    };
  }
  if (status === "needs_information") {
    return {
      label: "Връщане към документите",
      nextStatus: "awaiting_documents",
    };
  }
  if (status === "ready_for_submission") {
    return { label: "Изпращане за преглед", nextStatus: "submitted" };
  }
  return undefined;
};

type VerificationSummary = NonNullable<
  Awaited<ReturnType<typeof getOrganizationVerificationSummary>>
>;

const SettingsNotice = ({
  notice,
  state,
}: {
  readonly notice?: { readonly detail: string; readonly title: string };
  readonly state?: string;
}) => {
  if (!notice) {
    return null;
  }

  const isError =
    state?.includes("failed") ||
    state?.includes("conflict") ||
    state?.includes("invalid");

  return (
    <Alert variant={isError ? "destructive" : "default"}>
      <ShieldAlertIcon />
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.detail}</AlertDescription>
    </Alert>
  );
};

const KybVerificationSection = ({
  canManage,
  kybCase,
  legal,
}: {
  readonly canManage: boolean;
  readonly kybCase: VerificationSummary["currentKybCase"];
  readonly legal: VerificationSummary["legalEntity"];
}) => {
  const nextAction = kybCase ? nextCaseAction(kybCase.status) : undefined;

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <FileCheck2Icon className="size-4" />
          <h2 className="font-semibold text-sm">KYB проверка</h2>
        </div>
        <p className="mt-1 text-muted-foreground text-sm">
          Състоянието на проверката и сканирането на документите се проследяват
          отделно.
        </p>
      </div>
      <div className="space-y-4 p-4">
        {kybCase ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">Опит {kybCase.attempt}</p>
                <p className="text-muted-foreground text-xs">
                  Обновено на {formatDate(kybCase.updatedAt)}
                </p>
              </div>
              <Badge variant={statusVariant(kybCase.status)}>
                {label(kybCase.status)}
              </Badge>
            </div>
            {nextAction && canManage ? (
              <form action={transitionKybCaseAction}>
                <input
                  name="expectedVersion"
                  type="hidden"
                  value={kybCase.version}
                />
                <input name="kybCaseId" type="hidden" value={kybCase.id} />
                <input
                  name="nextStatus"
                  type="hidden"
                  value={nextAction.nextStatus}
                />
                <Button className="w-full" type="submit">
                  {nextAction.label}
                </Button>
              </form>
            ) : null}
          </>
        ) : (
          <div className="rounded-md bg-control p-3 text-sm">
            <p className="font-medium">Няма проверка</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Запазете юридическото лице, преди да стартирате KYB проверка.
            </p>
            <form action={startKybCaseAction} className="mt-3">
              <Button disabled={!(canManage && legal)} type="submit">
                Стартиране на KYB проверка
              </Button>
            </form>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-medium text-sm">Документи</p>
          {kybCase?.documents.length ? (
            kybCase.documents.map((document) => (
              <div
                className="flex items-center justify-between gap-3 border-t py-2"
                key={document.id}
              >
                <div>
                  <p className="text-sm">{label(document.kind)}</p>
                  <p className="text-muted-foreground text-xs">
                    {document.mimeType} · {formatDate(document.createdAt)}
                  </p>
                </div>
                <Badge variant={statusVariant(document.status)}>
                  {label(document.status)}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              Няма записани документи.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const DealerSettingsPage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const actor = await requireDealerOrganizationActor();
  const [summary, params] = await Promise.all([
    getOrganizationVerificationSummary(actor.dealerOrgId),
    searchParams,
  ]);
  if (!summary) {
    throw new Error("Dealer organization was not found");
  }
  const notice = params.state ? notices[params.state] : undefined;
  const legal = summary.legalEntity;
  const kybCase = summary.currentKybCase;
  const canManage = actor.role === "owner" || actor.role === "manager";

  return (
    <>
      <Header page="Настройка и проверка" pages={["AutoMarket", "Дилър"]} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <SettingsNotice notice={notice} state={params.state} />

        <section className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                Данни за организацията
              </p>
              <h1 className="mt-1 font-semibold text-lg">
                {summary.displayName}
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Статусите на регистрацията, KYB и доставчиците се показват
                отделно. Записан профил не означава, че организацията е
                проверена.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(summary.onboardingStatus)}>
                {label(summary.onboardingStatus)}
              </Badge>
              <Badge variant={statusVariant(summary.kybStatus)}>
                KYB: {label(summary.kybStatus)}
              </Badge>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
          <section className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <div className="flex items-center gap-2">
                <Building2Icon className="size-4" />
                <h2 className="font-semibold text-sm">Юридическо лице</h2>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                Трайни фирмени данни, използвани в процеса на проверка.
              </p>
            </div>
            <form
              action={saveLegalEntityAction}
              className="grid gap-4 p-4 sm:grid-cols-2"
            >
              {legal ? (
                <input
                  name="expectedDataVersion"
                  type="hidden"
                  value={legal.dataVersion}
                />
              ) : null}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="legalName">Регистрирано юридическо име</Label>
                <Input
                  defaultValue={legal?.legalName ?? ""}
                  disabled={!canManage}
                  id="legalName"
                  name="legalName"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradingName">Търговско име</Label>
                <Input
                  defaultValue={legal?.tradingName ?? ""}
                  disabled={!canManage}
                  id="tradingName"
                  name="tradingName"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityType">Вид на юридическото лице</Label>
                <select
                  className="h-9 w-full rounded-md border bg-control px-3 text-sm"
                  defaultValue={legal?.entityType ?? "private_company"}
                  disabled={!canManage}
                  id="entityType"
                  name="entityType"
                >
                  <option value="sole_proprietor">Едноличен търговец</option>
                  <option value="partnership">Съдружие</option>
                  <option value="private_company">Частно дружество</option>
                  <option value="public_company">Публично дружество</option>
                  <option value="nonprofit">
                    Юридическо лице с нестопанска цел
                  </option>
                  <option value="government">Държавна организация</option>
                  <option value="other">Друго</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Регистрационен номер</Label>
                <Input
                  defaultValue={legal?.registrationNumber ?? ""}
                  disabled={!canManage}
                  id="registrationNumber"
                  name="registrationNumber"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationCountryCode">
                  Държава на регистрация (ISO-2)
                </Label>
                <Input
                  defaultValue={legal?.registrationCountryCode ?? "BG"}
                  disabled={!canManage}
                  id="registrationCountryCode"
                  maxLength={2}
                  name="registrationCountryCode"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="addressLine1">Адрес на регистрация</Label>
                <Input
                  defaultValue={legal?.addressLine1 ?? ""}
                  disabled={!canManage}
                  id="addressLine1"
                  name="addressLine1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Град</Label>
                <Input
                  defaultValue={legal?.city ?? ""}
                  disabled={!canManage}
                  id="city"
                  name="city"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressCountryCode">
                  Държава на адреса (ISO-2)
                </Label>
                <Input
                  defaultValue={legal?.addressCountryCode ?? "BG"}
                  disabled={!canManage}
                  id="addressCountryCode"
                  maxLength={2}
                  name="addressCountryCode"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Пощенски код</Label>
                <Input
                  defaultValue={legal?.postalCode ?? ""}
                  disabled={!canManage}
                  id="postalCode"
                  name="postalCode"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatId">ДДС номер</Label>
                <Input
                  defaultValue={legal?.vatId ?? ""}
                  disabled={!canManage}
                  id="vatId"
                  name="vatId"
                />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button disabled={!canManage} type="submit">
                  Запазване на юридическото лице
                </Button>
              </div>
            </form>
          </section>

          <div className="space-y-4">
            <KybVerificationSection
              canManage={canManage}
              kybCase={kybCase}
              legal={legal}
            />

            <Alert
              variant={
                dealerProviderReadiness.privateStorage === "unconfigured"
                  ? "destructive"
                  : "default"
              }
            >
              <HardDriveUploadIcon />
              <AlertTitle>
                Частно хранилище за документи:{" "}
                {dealerProviderReadiness.privateStorage}
              </AlertTitle>
              <AlertDescription>
                {dealerProviderReadiness.privateStorage === "unconfigured"
                  ? "Качването на документи не е достъпно. Няма да бъде записан файл или успешен резултат, докато не бъде конфигуриран оторизиран частен доставчик."
                  : "Документите използват краткосрочно разрешение за частно качване, точна проверка на хеша и байтовете, карантина и статус от скенера."}
              </AlertDescription>
            </Alert>

            {summary.currentVerificationGrant ? (
              <section className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="size-4" />
                    <h2 className="font-semibold text-sm">
                      Разрешение след проверка
                    </h2>
                  </div>
                  <Badge
                    variant={statusVariant(
                      summary.currentVerificationGrant.status
                    )}
                  >
                    {label(summary.currentVerificationGrant.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-muted-foreground text-sm">
                  Валидно от{" "}
                  {formatDate(summary.currentVerificationGrant.validFrom)} до{" "}
                  {formatDate(summary.currentVerificationGrant.validUntil)}
                </p>
              </section>
            ) : (
              <section className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2">
                  <FileClockIcon className="size-4" />
                  <h2 className="font-semibold text-sm">
                    Няма активно разрешение след проверка
                  </h2>
                </div>
                <p className="mt-2 text-muted-foreground text-sm">
                  Чакаща или записана проверка не означава одобрение.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default DealerSettingsPage;
