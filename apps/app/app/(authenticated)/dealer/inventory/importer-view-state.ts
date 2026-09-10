import type {
  ImporterWorkspaceOverview,
  InventorySourceHealthRow,
} from "@repo/database/inventory-health";
import { requiredSupplierCapabilities } from "@repo/marketplace";

export type ImporterStatusTone =
  | "destructive"
  | "info"
  | "outline"
  | "secondary"
  | "success"
  | "warning";

export interface ImporterStatusView {
  readonly detail: string;
  readonly label: string;
  readonly tone: ImporterStatusTone;
}

export type ImporterAuthorizationGateKey =
  | "registration"
  | "kyb"
  | "trust"
  | "capabilities"
  | "markets";

export interface ImporterAuthorizationGateView extends ImporterStatusView {
  readonly key: ImporterAuthorizationGateKey;
  readonly name: string;
  readonly ready: boolean;
}

export interface ImporterAuthorizationView {
  readonly gates: readonly ImporterAuthorizationGateView[];
  readonly organizationGatesCurrent: boolean;
  readonly readiness: ImporterStatusView;
}

export interface InventorySourceHealthView {
  readonly connection: ImporterStatusView;
  readonly freshness: ImporterStatusView;
  readonly latestRun: ImporterStatusView;
  readonly quality: ImporterStatusView;
  readonly reconciliation: ImporterStatusView;
}

export interface InventorySourceHealthSummary {
  readonly connection: ImporterStatusView;
  readonly freshness: ImporterStatusView;
  readonly latestRun: ImporterStatusView;
  readonly quality: ImporterStatusView;
  readonly reconciliation: ImporterStatusView;
}

type TemporalAuthorizationState =
  | "blocked"
  | "current"
  | "expired"
  | "future"
  | "pending";

type ReconciliationState =
  | "applied"
  | "completed"
  | "held"
  | "incremental"
  | "not_applied"
  | "not_run"
  | "pending";

const terminalAuthorizationStatuses = new Set([
  "expired",
  "rejected",
  "revoked",
  "suspended",
]);

const syncingRunStatuses = new Set([
  "applying",
  "queued",
  "receiving",
  "validating",
]);

const dateFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const timestampFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const toTimestamp = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

const hasInvalidDate = (value?: string) =>
  Boolean(value && toTimestamp(value) === undefined);

export const formatImporterDate = (value?: string): string => {
  const timestamp = toTimestamp(value);
  return timestamp === undefined
    ? "Не е записано"
    : dateFormatter.format(new Date(timestamp));
};

export const formatImporterTimestamp = (value?: string): string => {
  const timestamp = toTimestamp(value);
  return timestamp === undefined
    ? "Не е записано"
    : `${timestampFormatter.format(new Date(timestamp))} UTC`;
};

export const formatImporterToken = (value: string): string => {
  const knownLabels: Record<string, string> = {
    active: "Активно",
    api: "API",
    applied: "Приложено",
    applied_with_issues: "Приложено с проблеми",
    applying: "Прилага се",
    apply_queued: "Прилагането е в опашка",
    approved: "Одобрено",
    cancelled: "Отменено",
    clean: "Чисто",
    completed: "Завършено",
    completed_with_issues: "Завършено с проблеми",
    created: "Създадено",
    csv: "CSV",
    dealer: "Дилър",
    degraded: "Влошено",
    disabled: "Изключено",
    distributor: "Дистрибутор",
    dms: "DMS",
    expired: "Изтекло",
    failed: "Неуспешно",
    feed_fetch: "Изтегляне на поток",
    full_snapshot: "Пълна снимка",
    https_feed: "HTTPS поток",
    importer: "Вносител",
    infected: "Заразено",
    incremental: "Инкрементално",
    ingress_bearer: "Входящ токен",
    in_review: "В преглед",
    json: "JSON",
    kyb_pending: "Очаква KYB",
    legacy: "Предишен източник",
    manufacturer: "Производител",
    manual: "Ръчно",
    mapping_required: "Нужно е съпоставяне",
    normalized_chunk: "Нормализиран пакет",
    not_configured: "Не е настроено",
    not_recorded: "Не е записано",
    not_started: "Не е започнато",
    original: "Оригинал",
    paused: "На пауза",
    pending: "Изчаква",
    previewing: "Подготвя се преглед",
    preview_queued: "Прегледът е в опашка",
    profile_incomplete: "Непълен профил",
    queued: "В опашка",
    ready: "Готово",
    receiving: "Получава се",
    registered: "Регистрирано",
    rejected: "Отхвърлено",
    retiring: "В извеждане",
    revoked: "Отнето",
    scan_pending: "Очаква сканиране",
    sftp: "SFTP",
    suspended: "Спряно",
    unavailable: "Недостъпно",
    unverified: "Непотвърдено",
    uploaded: "Качено",
    validating: "Проверява се",
    verified: "Потвърдено",
    webhook: "Уебхук",
  };

  if (knownLabels[value]) {
    return knownLabels[value];
  }

  return "Неизвестно";
};

const formatCount = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

const getTemporalAuthorizationState = ({
  endsAt,
  now,
  startsAt,
  status,
}: {
  endsAt?: string;
  now: Date;
  startsAt?: string;
  status?: string;
}): TemporalAuthorizationState => {
  if (status === "expired") {
    return "expired";
  }

  if (status !== "active") {
    return terminalAuthorizationStatuses.has(status ?? "")
      ? "blocked"
      : "pending";
  }

  if (hasInvalidDate(startsAt) || hasInvalidDate(endsAt)) {
    return "blocked";
  }

  const nowTimestamp = now.getTime();
  const startsAtTimestamp = toTimestamp(startsAt);
  const endsAtTimestamp = toTimestamp(endsAt);

  if (startsAtTimestamp !== undefined && startsAtTimestamp > nowTimestamp) {
    return "future";
  }

  if (endsAtTimestamp !== undefined && endsAtTimestamp <= nowTimestamp) {
    return "expired";
  }

  return "current";
};

const getVerificationState = ({
  expiresAt,
  now,
  status,
}: {
  expiresAt?: string;
  now: Date;
  status: string;
}): TemporalAuthorizationState => {
  if (status === "expired") {
    return "expired";
  }

  if (status !== "verified") {
    return terminalAuthorizationStatuses.has(status) || status === "rejected"
      ? "blocked"
      : "pending";
  }

  if (hasInvalidDate(expiresAt)) {
    return "blocked";
  }

  const expiresAtTimestamp = toTimestamp(expiresAt);
  if (expiresAtTimestamp !== undefined && expiresAtTimestamp <= now.getTime()) {
    return "expired";
  }

  return "current";
};

const getTemporalStateLabel = (state: TemporalAuthorizationState) => {
  const labels: Record<TemporalAuthorizationState, string> = {
    blocked: "Блокирано",
    current: "Актуално",
    expired: "Изтекло",
    future: "Започва по-късно",
    pending: "Изчаква",
  };
  return labels[state];
};

const getTemporalStateTone = (
  state: TemporalAuthorizationState
): ImporterStatusTone => {
  if (state === "current") {
    return "success";
  }

  if (state === "blocked" || state === "expired") {
    return "destructive";
  }

  return state === "future" ? "info" : "warning";
};

const getGateTone = (
  ready: boolean,
  hasTerminalState: boolean
): ImporterStatusTone => {
  if (ready) {
    return "success";
  }

  return hasTerminalState ? "destructive" : "warning";
};

const getRegistrationGate = (
  organization: ImporterWorkspaceOverview["organization"]
): ImporterAuthorizationGateView => {
  const ready = organization.onboardingStatus === "approved";
  const blocked = ["rejected", "suspended"].includes(
    organization.onboardingStatus
  );

  return {
    detail: ready
      ? `${formatImporterToken(organization.orgType)} · регистрацията е одобрена`
      : `Процес: ${formatImporterToken(organization.onboardingStatus)}`,
    key: "registration",
    label: formatImporterToken(organization.onboardingStatus),
    name: "Регистрация",
    ready,
    tone: getGateTone(ready, blocked),
  };
};

const getVerificationGate = ({
  expiresAt,
  key,
  name,
  now,
  status,
}: {
  expiresAt?: string;
  key: "kyb" | "trust";
  name: string;
  now: Date;
  status: string;
}): ImporterAuthorizationGateView => {
  const state = getVerificationState({ expiresAt, now, status });
  const ready = state === "current";
  let detail = `Състояние: ${formatImporterToken(status)}`;

  if (expiresAt && (state === "current" || state === "expired")) {
    detail = `${state === "expired" ? "Изтекло на" : "Валидно до"} ${formatImporterDate(expiresAt)}`;
  }

  return {
    detail,
    key,
    label:
      state === "current"
        ? formatImporterToken(status)
        : getTemporalStateLabel(state),
    name,
    ready,
    tone: getTemporalStateTone(state),
  };
};

const capabilityLabels: Record<
  (typeof requiredSupplierCapabilities)[number],
  string
> = {
  "inventory.supply": "Доставка",
  "marketplace.publish": "Публикуване",
};

const inventoryPublishPermissionKey = "inventory.publish";

const getCapabilitiesGate = (
  capabilities: ImporterWorkspaceOverview["capabilities"],
  now: Date
): ImporterAuthorizationGateView => {
  const states = requiredSupplierCapabilities.map((capabilityKey) => {
    const capability = capabilities.find(
      (candidate) => candidate.capabilityKey === capabilityKey
    );
    const state = capability
      ? getTemporalAuthorizationState({
          endsAt: capability.expiresAt,
          now,
          status: capability.status,
        })
      : "pending";

    return { capabilityKey, state };
  });
  const currentCount = states.filter(({ state }) => state === "current").length;
  const ready = currentCount === requiredSupplierCapabilities.length;
  const hasTerminalState = states.some(({ state }) =>
    ["blocked", "expired"].includes(state)
  );

  return {
    detail: states
      .map(
        ({ capabilityKey, state }) =>
          `${capabilityLabels[capabilityKey]}: ${getTemporalStateLabel(state)}`
      )
      .join(" · "),
    key: "capabilities",
    label: ready
      ? "Актуални"
      : `${currentCount}/${requiredSupplierCapabilities.length} актуални`,
    name: "Права",
    ready,
    tone: getGateTone(ready, hasTerminalState),
  };
};

const getMarketsGate = (
  permissions: ImporterWorkspaceOverview["marketPermissions"],
  now: Date
): ImporterAuthorizationGateView => {
  const publishingPermissions = permissions.filter(
    (permission) => permission.permissionKey === inventoryPublishPermissionKey
  );

  if (publishingPermissions.length === 0) {
    return {
      detail: "Няма записано право inventory.publish",
      key: "markets",
      label: "Не е дадено",
      name: "Пазарни права",
      ready: false,
      tone: "warning",
    };
  }

  const states = publishingPermissions.map((permission) =>
    getTemporalAuthorizationState({
      endsAt: permission.validUntil,
      now,
      startsAt: permission.validFrom,
      status: permission.status,
    })
  );
  const countState = (state: TemporalAuthorizationState) =>
    states.filter((candidate) => candidate === state).length;
  const currentCount = countState("current");
  const ready = currentCount === publishingPermissions.length;
  const attentionParts = (["future", "expired", "blocked", "pending"] as const)
    .map((state) => ({ count: countState(state), state }))
    .filter(({ count }) => count > 0)
    .map(
      ({ count, state }) =>
        `${count} ${getTemporalStateLabel(state).toLocaleLowerCase("bg-BG")}`
    );
  const marketCount = new Set(
    publishingPermissions.map((permission) => permission.marketCode)
  ).size;
  const hasTerminalState =
    countState("expired") > 0 || countState("blocked") > 0;

  return {
    detail: ready
      ? `${formatCount(marketCount, "пазар", "пазара")} · ${formatCount(publishingPermissions.length, "право за категория", "права за категории")}`
      : `${currentCount} актуални${attentionParts.length > 0 ? ` · ${attentionParts.join(" · ")}` : ""}`,
    key: "markets",
    label: ready
      ? "Актуални"
      : `${currentCount}/${publishingPermissions.length} актуални`,
    name: "Пазарни права",
    ready,
    tone: getGateTone(ready, hasTerminalState),
  };
};

export const getImporterAuthorizationView = (
  overview: ImporterWorkspaceOverview,
  now = new Date()
): ImporterAuthorizationView => {
  const gates: readonly ImporterAuthorizationGateView[] = [
    getRegistrationGate(overview.organization),
    getVerificationGate({
      expiresAt: overview.organization.kybExpiresAt,
      key: "kyb",
      name: "KYB",
      now,
      status: overview.organization.kybStatus,
    }),
    getVerificationGate({
      expiresAt: overview.organization.supplierTrustExpiresAt,
      key: "trust",
      name: "Доверие към доставчика",
      now,
      status: overview.organization.supplierTrustStatus,
    }),
    getCapabilitiesGate(overview.capabilities, now),
    getMarketsGate(overview.marketPermissions, now),
  ];
  const blockedGateNames = gates
    .filter((gate) => !gate.ready)
    .map((gate) => gate.name);
  const organizationGatesCurrent = blockedGateNames.length === 0;
  const hasTerminalGate = gates.some(
    (gate) => !gate.ready && gate.tone === "destructive"
  );

  return {
    gates,
    organizationGatesCurrent,
    readiness: organizationGatesCurrent
      ? {
          detail:
            "За всяка обява остават проверките за права, медия, източник, оферта, идентичност, данни, валута и модерация.",
          label: "Проверките са актуални",
          tone: "success",
        }
      : {
          detail: `Изискват внимание: ${blockedGateNames.join(", ")}`,
          label: "Публикуването е блокирано",
          tone: hasTerminalGate ? "destructive" : "warning",
        },
  };
};

const getLastGoodDetail = (source: InventorySourceHealthRow) =>
  source.lastSuccessfulSyncAt
    ? `Последен успешен импорт ${formatImporterTimestamp(source.lastSuccessfulSyncAt)}`
    : "Няма завършен импорт";

const getConnectionView = (
  source: InventorySourceHealthRow
): ImporterStatusView => {
  if (source.connectionStatus === "active") {
    return {
      detail: `${formatImporterToken(source.kind)} връзка`,
      label: "Свързана",
      tone: "success",
    };
  }

  if (source.connectionStatus === "degraded") {
    return {
      detail: `${formatCount(source.consecutiveFailureCount, "пореден неуспех", "поредни неуспеха")} · ${getLastGoodDetail(source)}`,
      label: "Влошена",
      tone: "warning",
    };
  }

  if (source.connectionStatus === "paused") {
    return {
      detail: getLastGoodDetail(source),
      label: "На пауза",
      tone: "warning",
    };
  }

  if (source.connectionStatus === "disconnected") {
    return {
      detail: getLastGoodDetail(source),
      label: "Прекъсната",
      tone: "destructive",
    };
  }

  return {
    detail: "Настройката на връзката не е завършена",
    label: "Очаква настройка",
    tone: "secondary",
  };
};

const getLatestRunView = (
  source: InventorySourceHealthRow
): ImporterStatusView => {
  const run = source.latestRun;

  if (!run) {
    return {
      detail: "Очаква се първият импорт",
      label: "Няма импорти",
      tone: "secondary",
    };
  }

  if (syncingRunStatuses.has(run.status)) {
    return {
      detail: source.lastSuccessfulSyncAt
        ? `${formatImporterToken(run.status)} от ${formatImporterTimestamp(run.startedAt)} · ${getLastGoodDetail(source)}`
        : `${formatImporterToken(run.status)} от ${formatImporterTimestamp(run.startedAt)}`,
      label: source.lastSuccessfulSyncAt
        ? "Синхронизира се"
        : "Първа синхронизация",
      tone: "info",
    };
  }

  if (run.status === "failed") {
    const detail = source.lastSuccessfulSyncAt
      ? `Опит ${formatImporterTimestamp(run.completedAt ?? source.lastAttemptAt)} · ${getLastGoodDetail(source)} е запазен`
      : `Опит ${formatImporterTimestamp(run.completedAt ?? source.lastAttemptAt)} · няма завършен инвентар за запазване`;

    return {
      detail,
      label: "Неуспешен",
      tone: "destructive",
    };
  }

  if (run.status === "completed_with_issues") {
    return {
      detail: `Завършен ${formatImporterTimestamp(run.completedAt)}`,
      label: "Завършен с проблеми",
      tone: "warning",
    };
  }

  if (run.status === "completed") {
    return {
      detail: `Завършен ${formatImporterTimestamp(run.completedAt)}`,
      label: "Завършен",
      tone: "success",
    };
  }

  return {
    detail: `Състояние на импорта: ${formatImporterToken(run.status)}`,
    label: "Неизвестно състояние",
    tone: "secondary",
  };
};

const getFreshnessView = (
  source: InventorySourceHealthRow
): ImporterStatusView => {
  if (source.freshness === "fresh") {
    return {
      detail: getLastGoodDetail(source),
      label: "Актуален",
      tone: "success",
    };
  }

  if (source.freshness === "stale") {
    return {
      detail: getLastGoodDetail(source),
      label: "Остарял",
      tone: "warning",
    };
  }

  return {
    detail: source.lastSuccessfulSyncAt
      ? `${getLastGoodDetail(source)} · няма краен срок за актуалност`
      : "Няма завършен импорт или краен срок за актуалност",
    label: "Неизвестна",
    tone: "secondary",
  };
};

const formatIssueCounts = (source: InventorySourceHealthRow) => {
  const parts = [
    [source.issueCounts.blocking, "блокиращи"],
    [source.issueCounts.error, "грешки"],
    [source.issueCounts.warning, "предупреждения"],
    [source.latestRun?.rejectedCount ?? 0, "отхвърлени"],
  ] as const;

  return parts
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(" · ");
};

const getQualityView = (
  source: InventorySourceHealthRow
): ImporterStatusView => {
  const run = source.latestRun;
  const invalidCount =
    source.issueCounts.blocking +
    source.issueCounts.error +
    (run?.rejectedCount ?? 0);

  if (invalidCount > 0) {
    return {
      detail: formatIssueCounts(source),
      label: "Невалидни / проблеми",
      tone: "destructive",
    };
  }

  if (source.issueCounts.warning > 0) {
    return {
      detail: formatIssueCounts(source),
      label: "Предупреждения",
      tone: "warning",
    };
  }

  if (!run) {
    return {
      detail: "Няма резултат от проверка",
      label: "Непроверено",
      tone: "secondary",
    };
  }

  if (syncingRunStatuses.has(run.status)) {
    return {
      detail: `${formatCount(run.receivedCount, "получен запис", "получени записа")} до момента`,
      label: "Проверява се",
      tone: "info",
    };
  }

  if (run.status === "failed") {
    return {
      detail: "Последният опит не завърши проверката",
      label: "Неуспешен импорт",
      tone: "destructive",
    };
  }

  if (run.status === "completed_with_issues") {
    return {
      detail: "Импортът отчете проблеми без брой по записи",
      label: "Отчетени проблеми",
      tone: "warning",
    };
  }

  if (run.status === "completed") {
    return {
      detail: `${run.receivedCount} получени · 0 отхвърлени`,
      label: "Без проблеми",
      tone: "success",
    };
  }

  return {
    detail: "Няма разпознат резултат от проверка",
    label: "Неизвестно",
    tone: "secondary",
  };
};

const latestRunCompletedSnapshot = (source: InventorySourceHealthRow) => {
  const runCompletedAt = toTimestamp(source.latestRun?.completedAt);
  const lastCompleteSnapshotAt = toTimestamp(source.lastCompleteSnapshotAt);

  return (
    source.latestRun?.status === "completed" &&
    runCompletedAt !== undefined &&
    lastCompleteSnapshotAt !== undefined &&
    lastCompleteSnapshotAt >= runCompletedAt
  );
};

const getReconciliationState = (
  source: InventorySourceHealthRow
): ReconciliationState => {
  if (source.syncMode === "incremental") {
    return "incremental";
  }

  const run = source.latestRun;
  if (!run) {
    return "not_run";
  }

  if (syncingRunStatuses.has(run.status)) {
    return "pending";
  }

  if (run.status === "failed" || run.status === "completed_with_issues") {
    return "held";
  }

  if (!latestRunCompletedSnapshot(source)) {
    return "not_applied";
  }

  return run.missingCount > 0 || run.unpublishedCount > 0
    ? "applied"
    : "completed";
};

const getReconciliationView = (
  source: InventorySourceHealthRow
): ImporterStatusView => {
  const state = getReconciliationState(source);

  if (state === "incremental") {
    return {
      detail: "Съгласуването по липса в снимка не се прилага",
      label: "Инкрементално",
      tone: "outline",
    };
  }

  const run = source.latestRun;
  if (state === "not_run" || !run) {
    return {
      detail: "Няма завършена пълна снимка",
      label: "Не е изпълнено",
      tone: "secondary",
    };
  }

  if (state === "pending") {
    return {
      detail: "Очаква се пълна успешна снимка",
      label: "Изчаква",
      tone: "info",
    };
  }

  if (state === "held" && run.status === "failed") {
    return {
      detail: source.lastCompleteSnapshotAt
        ? `Последна пълна снимка ${formatImporterTimestamp(source.lastCompleteSnapshotAt)} · успешният инвентар е запазен`
        : "Неуспешният импорт не създаде пълна снимка",
      label: "Задържано",
      tone: "warning",
    };
  }

  if (state === "held") {
    return {
      detail: "Отхвърлени записи попречиха на съгласуването",
      label: "Задържано",
      tone: "warning",
    };
  }

  if (state === "not_applied") {
    return {
      detail: source.lastCompleteSnapshotAt
        ? `Последната пълна снимка остава от ${formatImporterTimestamp(source.lastCompleteSnapshotAt)}`
        : "Последният импорт не е записан като пълна снимка",
      label: "Не е приложено",
      tone: "secondary",
    };
  }

  const changes = [
    run.missingCount > 0 ? `${run.missingCount} липсващи` : undefined,
    run.unpublishedCount > 0 ? `${run.unpublishedCount} свалени` : undefined,
  ].filter((value): value is string => Boolean(value));

  return {
    detail:
      changes.length > 0
        ? changes.join(" · ")
        : "Пълна снимка · няма промени от съгласуването",
    label: state === "applied" ? "Приложено" : "Завършено",
    tone: "success",
  };
};

export const getInventorySourceHealthView = (
  source: InventorySourceHealthRow
): InventorySourceHealthView => ({
  connection: getConnectionView(source),
  freshness: getFreshnessView(source),
  latestRun: getLatestRunView(source),
  quality: getQualityView(source),
  reconciliation: getReconciliationView(source),
});

const getConnectionSummary = (
  sources: readonly InventorySourceHealthRow[]
): ImporterStatusView => {
  const activeCount = sources.filter(
    (source) => source.connectionStatus === "active"
  ).length;
  const degradedCount = sources.filter(
    (source) => source.connectionStatus === "degraded"
  ).length;
  const disconnectedCount = sources.filter(
    (source) => source.connectionStatus === "disconnected"
  ).length;

  if (activeCount === sources.length) {
    return {
      detail: formatCount(
        sources.length,
        "активен източник",
        "активни източника"
      ),
      label: "Всички са свързани",
      tone: "success",
    };
  }

  if (disconnectedCount > 0) {
    return {
      detail: `${activeCount} активни · ${degradedCount} влошени`,
      label: formatCount(
        disconnectedCount,
        "прекъсната връзка",
        "прекъснати връзки"
      ),
      tone: "destructive",
    };
  }

  if (degradedCount > 0) {
    return {
      detail: `${activeCount} активни · ${degradedCount} влошени`,
      label: formatCount(degradedCount, "влошена връзка", "влошени връзки"),
      tone: "warning",
    };
  }

  return {
    detail: `${sources.length - activeCount} изискват внимание`,
    label: `${activeCount}/${sources.length} свързани`,
    tone: "warning",
  };
};

const getLatestRunSummary = (
  sources: readonly InventorySourceHealthRow[],
  views: readonly InventorySourceHealthView[]
): ImporterStatusView => {
  const failedRunCount = sources.filter(
    (source) => source.latestRun?.status === "failed"
  ).length;
  const retainedLastGoodCount = sources.filter(
    (source) =>
      source.latestRun?.status === "failed" && source.lastSuccessfulSyncAt
  ).length;
  const syncingCount = sources.filter((source) =>
    syncingRunStatuses.has(source.latestRun?.status ?? "")
  ).length;
  const noRunCount = sources.filter((source) => !source.latestRun).length;

  if (failedRunCount > 0) {
    const detail =
      retainedLastGoodCount > 0
        ? formatCount(
            retainedLastGoodCount,
            "последен успешен инвентар е запазен",
            "последни успешни инвентара са запазени"
          )
        : "Все още няма успешен импорт";

    return {
      detail,
      label: formatCount(
        failedRunCount,
        "неуспешен импорт",
        "неуспешни импорта"
      ),
      tone: "destructive",
    };
  }

  if (syncingCount > 0) {
    return {
      detail: "Има импорти в ход",
      label: formatCount(syncingCount, "синхронизация", "синхронизации"),
      tone: "info",
    };
  }

  if (noRunCount === sources.length) {
    return {
      detail: "Очаква се първият импорт",
      label: "Няма импорти",
      tone: "secondary",
    };
  }

  if (noRunCount === 0) {
    return {
      detail: "Последните опити са завършени",
      label: "Има записани импорти",
      tone: views.some((view) => view.latestRun.tone === "warning")
        ? "warning"
        : "success",
    };
  }

  return {
    detail: formatCount(
      noRunCount,
      "източник очаква първи импорт",
      "източника очакват първи импорт"
    ),
    label: "Смесено състояние",
    tone: "secondary",
  };
};

const getFreshnessSummary = (
  sources: readonly InventorySourceHealthRow[]
): ImporterStatusView => {
  const staleCount = sources.filter(
    (source) => source.freshness === "stale"
  ).length;
  const freshCount = sources.filter(
    (source) => source.freshness === "fresh"
  ).length;

  if (staleCount > 0) {
    return {
      detail: `${freshCount} актуални · ${staleCount} остарели`,
      label: formatCount(staleCount, "остарял източник", "остарели източника"),
      tone: "warning",
    };
  }

  if (freshCount === sources.length) {
    return {
      detail: "Сроковете са актуални",
      label: "Всички са актуални",
      tone: "success",
    };
  }

  return {
    detail: `${sources.length - freshCount} с неизвестна актуалност`,
    label: `${freshCount}/${sources.length} актуални`,
    tone: "secondary",
  };
};

const getQualitySummary = (
  sources: readonly InventorySourceHealthRow[],
  views: readonly InventorySourceHealthView[]
): ImporterStatusView => {
  const invalidCount = views.filter(
    (view) => view.quality.tone === "destructive"
  ).length;
  const warningCount = views.filter(
    (view) => view.quality.tone === "warning"
  ).length;
  const noRunCount = sources.filter((source) => !source.latestRun).length;
  const syncingCount = sources.filter((source) =>
    syncingRunStatuses.has(source.latestRun?.status ?? "")
  ).length;

  if (invalidCount > 0) {
    return {
      detail: "Невалидни записи или грешки",
      label: formatCount(
        invalidCount,
        "източник с проблеми",
        "източника с проблеми"
      ),
      tone: "destructive",
    };
  }

  if (warningCount > 0) {
    return {
      detail: "Предупрежденията изискват преглед",
      label: formatCount(warningCount, "предупреждение", "предупреждения"),
      tone: "warning",
    };
  }

  if (noRunCount > 0 || syncingCount > 0) {
    return {
      detail: "Проверката не е завършена",
      label: "Очакват проверки",
      tone: "secondary",
    };
  }

  return {
    detail: "Последната проверка е чиста",
    label: "Няма проблеми",
    tone: "success",
  };
};

const getReconciliationSummary = (
  sources: readonly InventorySourceHealthRow[]
): ImporterStatusView => {
  const fullSnapshotStates = sources
    .filter((source) => source.syncMode === "full_snapshot")
    .map(getReconciliationState);

  if (fullSnapshotStates.length === 0) {
    return {
      detail: "Няма пълни снимки",
      label: "Само инкрементални",
      tone: "outline",
    };
  }

  const heldCount = fullSnapshotStates.filter(
    (state) => state === "held"
  ).length;
  const completedCount = fullSnapshotStates.filter(
    (state) => state === "applied" || state === "completed"
  ).length;
  let tone: ImporterStatusTone = "secondary";

  if (heldCount > 0) {
    tone = "warning";
  } else if (completedCount === fullSnapshotStates.length) {
    tone = "success";
  }

  return {
    detail: `Съгласувани снимки: ${completedCount}/${fullSnapshotStates.length}`,
    label:
      heldCount > 0
        ? formatCount(heldCount, "задържана снимка", "задържани снимки")
        : formatCount(completedCount, "завършена снимка", "завършени снимки"),
    tone,
  };
};

export const getInventorySourceHealthSummary = (
  sources: readonly InventorySourceHealthRow[]
): InventorySourceHealthSummary => {
  if (sources.length === 0) {
    const emptyState: ImporterStatusView = {
      detail: "Няма регистрирани източници",
      label: "Няма източници",
      tone: "secondary",
    };

    return {
      connection: emptyState,
      freshness: emptyState,
      latestRun: emptyState,
      quality: emptyState,
      reconciliation: emptyState,
    };
  }

  const views = sources.map(getInventorySourceHealthView);

  return {
    connection: getConnectionSummary(sources),
    freshness: getFreshnessSummary(sources),
    latestRun: getLatestRunSummary(sources, views),
    quality: getQualitySummary(sources, views),
    reconciliation: getReconciliationSummary(sources),
  };
};
