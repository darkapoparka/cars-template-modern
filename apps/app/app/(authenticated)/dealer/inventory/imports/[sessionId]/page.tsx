import { database, type Prisma } from "@repo/database";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileSearchIcon,
  GitCompareArrowsIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDealerOrganizationActor } from "../../../actor";
import { dealerProviderReadiness } from "../../../provider-adapters";
import {
  approveInventoryImportAction,
  generateInventoryImportPreviewAction,
} from "../../actions";
import { getImportSessionStatusView } from "../../components/import-session-list";
import { ImporterPageHeader } from "../../components/importer-page-header";
import {
  formatImporterTimestamp,
  formatImporterToken,
} from "../../importer-view-state";

export const metadata: Metadata = {
  title: "Преглед на импорта",
  description: "Преглед на надежден импорт на инвентар.",
};

const importSessionInclude = {
  artifacts: { orderBy: { createdAt: "desc" } },
  chunks: { orderBy: { chunkIndex: "asc" } },
  inventorySource: {
    select: { name: true, sourceKey: true, status: true },
  },
  mappingVersion: true,
  previews: {
    include: {
      issues: { orderBy: [{ severity: "asc" }, { rowNumber: "asc" }] },
    },
    orderBy: { previewVersion: "desc" },
    take: 1,
  },
} satisfies Prisma.InventoryImportSessionInclude;

type ImportSession = Prisma.InventoryImportSessionGetPayload<{
  include: typeof importSessionInclude;
}>;
type ImportArtifact = ImportSession["artifacts"][number];
type ImportPreview = ImportSession["previews"][number];

const messages: Readonly<Record<string, { detail: string; title: string }>> = {
  apply_failed: {
    detail:
      "Заявката за прилагане не беше приета. Не е отчетен успешен резултат.",
    title: "Прилагането не е добавено в опашката",
  },
  apply_queued: {
    detail:
      "Приетият преглед е добавен в опашката с изключително заключване на източника.",
    title: "Прилагането е добавено в опашката",
  },
  import_conflict: {
    detail:
      "Сесията, прегледът, версията на източника, разрешението или заключването са променени. Проверете текущото състояние, преди да опитате отново.",
    title: "Състоянието на импорта е променено",
  },
  preview_conflict: {
    detail:
      "Провереният файл, съпоставянето, сесията, организацията или версията на източника са променени. Не е записан преглед.",
    title: "Състоянието на прегледа е променено",
  },
  preview_failed: {
    detail:
      "Проверката на частния файл или надеждното изчисление на прегледа е неуспешно. Не е отчетен успешен преглед.",
    title: "Прегледът не е генериран",
  },
  preview_generated: {
    detail:
      "Частният файл беше проверен повторно и е записан надежден преглед, изчислен от системата.",
    title: "Прегледът е генериран",
  },
  preview_storage_unavailable: {
    detail:
      "Частното хранилище не е конфигурирано, затова файлът не е прочетен и не е записан преглед.",
    title: "Прегледът не е достъпен",
  },
};

const tone = (status: string) => {
  if (["clean", "accepted", "completed"].includes(status)) {
    return "success" as const;
  }
  if (["infected", "rejected", "failed", "unavailable"].includes(status)) {
    return "destructive" as const;
  }
  if (["pending", "quarantined", "scanning"].includes(status)) {
    return "warning" as const;
  }
  return "secondary" as const;
};

const unavailablePreviewDetails: Readonly<Record<string, string>> = {
  mapping_required:
    "Файлът е чист, но няма записан надежден преглед, изчислен от системата. Клиентски или подадени от приложението стойности за въздействие не се приемат.",
  scan_pending:
    "Частният файл все още очаква потвърден чист резултат от скенера.",
};

const ImportStateMessage = ({
  message,
  success,
}: {
  readonly message?: { detail: string; title: string };
  readonly success: boolean;
}) => {
  if (!message) {
    return null;
  }

  const Icon = success ? CheckCircle2Icon : ShieldAlertIcon;
  return (
    <Alert variant={success ? "default" : "destructive"}>
      <Icon />
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription>{message.detail}</AlertDescription>
    </Alert>
  );
};

const ImportMaterialSummary = ({
  artifact,
  session,
}: {
  readonly artifact?: ImportArtifact;
  readonly session: ImportSession;
}) => (
  <section className="rounded-lg border bg-card">
    <div className="border-b p-4">
      <div className="flex items-center gap-2">
        <FileSearchIcon className="size-4" />
        <h2 className="font-semibold text-sm">Файл, сканиране и съпоставяне</h2>
      </div>
    </div>
    <div className="grid gap-4 p-4 sm:grid-cols-3">
      <div>
        <p className="text-muted-foreground text-xs">Частен файл</p>
        <p className="mt-1 font-medium text-sm">
          {artifact
            ? `${(artifact.byteSize / 1024).toFixed(1)} KiB`
            : "Няма запис"}
        </p>
        <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
          {artifact?.sha256 ?? "Няма проверен хеш"}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Резултат от скенера</p>
        <Badge
          className="mt-1"
          variant={tone(artifact?.scanStatus ?? "pending")}
        >
          {formatImporterToken(artifact?.scanStatus ?? "not_recorded")}
        </Badge>
        <p className="mt-1 text-muted-foreground text-xs">
          {artifact?.scanProviderName
            ? `${artifact.scanProviderName} · ${formatImporterTimestamp(artifact.scannedAt?.toISOString())}`
            : "Няма записан подписан резултат"}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Канонично съпоставяне</p>
        <p className="mt-1 font-medium text-sm">
          {session.mappingVersion
            ? `Версия ${session.mappingVersion.version}`
            : "Не е обвързано"}
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          {session.mappingVersion
            ? `${session.mappingVersion.templateId} · ${session.mappingVersion.delimiter === "\t" ? "табулатор" : session.mappingVersion.delimiter}`
            : "Съпоставянето не е преглед"}
        </p>
      </div>
    </div>
  </section>
);

const ImportPreviewSection = ({
  preview,
  sessionStatus,
}: {
  readonly preview?: ImportPreview;
  readonly sessionStatus: string;
}) => {
  if (!preview) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Надеждният преглед не е достъпен</AlertTitle>
        <AlertDescription>
          {unavailablePreviewDetails[sessionStatus] ??
            "Няма траен преглед, обвързан с тази сесия."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <GitCompareArrowsIcon className="size-4" />
          <h2 className="font-semibold text-sm">
            Обвързан преглед v{preview.previewVersion}
          </h2>
        </div>
        <p className="mt-1 text-muted-foreground text-sm">
          Изчислено спрямо конфигурация на източника v
          {preview.sourceConfigVersion} и версия на данните{" "}
          {preview.sourceDataRevision}; валидно до{" "}
          {formatImporterTimestamp(preview.expiresAt.toISOString())}.
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 lg:grid-cols-7">
        {[
          ["Валидни", preview.validCount],
          ["Под карантина", preview.quarantinedCount],
          ["Блокиращи", preview.blockingCount],
          ["Липсващи", preview.missingCount],
          ["Задържани", preview.heldCount],
          ["Ще бъдат свалени", preview.wouldUnpublishCount],
          ["Прогнозни", preview.projectedPublicationCount],
        ].map(([key, value]) => (
          <div key={key}>
            <dt className="text-muted-foreground text-xs">{key}</dt>
            <dd className="mt-1 font-semibold text-lg">{value}</dd>
          </div>
        ))}
      </dl>
      {preview.issues.length ? (
        <div className="divide-y border-t">
          {preview.issues.slice(0, 20).map((issue) => (
            <div
              className="grid gap-1 px-4 py-3 sm:grid-cols-[5rem_8rem_1fr]"
              key={issue.id}
            >
              <Badge
                variant={
                  issue.severity === "blocking" || issue.severity === "error"
                    ? "destructive"
                    : "warning"
                }
              >
                {issue.severity}
              </Badge>
              <span className="font-mono text-xs">
                {issue.rowNumber ? `Ред ${issue.rowNumber}` : "Файл"}
              </span>
              <span className="text-muted-foreground text-sm">
                {issue.safeMessage}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

const PreviewGenerationCard = ({
  artifact,
  canGeneratePreview,
  canGeneratePreviewRole,
  preview,
  previewCurrent,
  session,
}: {
  readonly artifact?: ImportArtifact;
  readonly canGeneratePreview: boolean;
  readonly canGeneratePreviewRole: boolean;
  readonly preview?: ImportPreview;
  readonly previewCurrent: boolean;
  readonly session: ImportSession;
}) => (
  <section className="rounded-lg border bg-card p-4">
    <div className="flex items-center gap-2">
      <RefreshCwIcon className="size-4" />
      <h2 className="font-semibold text-sm">Надежден преглед</h2>
    </div>
    <p className="mt-1 text-muted-foreground text-sm">
      Сървърът прочита отново трайно съхранения частен файл, проверява точните
      байтове и хеша му, прилага записаното съпоставяне и изчислява
      въздействието върху пазара. Формулярът не подава редове, броячи, проблеми,
      хеш или срок.
    </p>
    <form action={generateInventoryImportPreviewAction} className="mt-4">
      <input name="importSessionId" type="hidden" value={session.id} />
      <Button className="w-full" disabled={!canGeneratePreview} type="submit">
        {preview
          ? "Преизчисляване на надеждния преглед"
          : "Генериране на надежден преглед"}
      </Button>
    </form>
    {canGeneratePreviewRole ? null : (
      <p className="mt-3 text-destructive text-xs">
        Членовете с роля за преглед не могат да генерират прегледи на импорт.
      </p>
    )}
    {dealerProviderReadiness.privateStorage !== "configured" ? (
      <p className="mt-3 text-destructive text-xs">
        Частното хранилище не е конфигурирано. Не може да се прочете файл или да
        се изчисли преглед.
      </p>
    ) : null}
    {artifact?.scanStatus !== "clean" ? (
      <p className="mt-3 text-destructive text-xs">
        Преди генериране на преглед е нужен чист резултат от скенера.
      </p>
    ) : null}
    {session.mappingVersion ? null : (
      <p className="mt-3 text-destructive text-xs">
        Преди генериране на преглед трябва да бъде обвързано трайно канонично
        съпоставяне.
      </p>
    )}
    {preview && !previewCurrent && session.status === "ready" ? (
      <p className="mt-3 text-destructive text-xs">
        Срокът на този преглед изтече. Преизчислете го преди одобрение;
        предишният остава видим като история.
      </p>
    ) : null}
    {previewCurrent && session.status === "ready" ? (
      <p className="mt-3 text-muted-foreground text-xs">
        Текущият преглед е готов за одобрение. Преизчисляването отново ще
        провери файла и текущата версия на източника.
      </p>
    ) : null}
  </section>
);

const ImportApprovalCard = ({
  canApprove,
  canApproveRole,
  fullSnapshotHeld,
  preview,
  previewCurrent,
  session,
}: {
  readonly canApprove: boolean;
  readonly canApproveRole: boolean;
  readonly fullSnapshotHeld: boolean;
  readonly preview?: ImportPreview;
  readonly previewCurrent: boolean;
  readonly session: ImportSession;
}) => (
  <section className="rounded-lg border bg-card p-4">
    <h2 className="font-semibold text-sm">Одобрение</h2>
    <p className="mt-1 text-muted-foreground text-sm">
      При одобрение отново се проверяват ролята, срокът на случая, данните за
      файла, хешът на съпоставянето, конфигурацията и версията на източника и
      наличността на заключването.
    </p>
    {preview ? (
      <form action={approveInventoryImportAction} className="mt-4 space-y-3">
        <input
          name="expectedSessionVersion"
          type="hidden"
          value={session.version}
        />
        <input name="importSessionId" type="hidden" value={session.id} />
        <input
          name="previewDigest"
          type="hidden"
          value={preview.previewDigest}
        />
        {session.mode === "full_snapshot" ? (
          <label className="flex items-start gap-2 rounded-md bg-control/55 p-3 text-sm">
            <input name="acknowledgeFullSnapshot" required type="checkbox" />
            <span>Одобрявам съгласуването на липсите при пълна снимка.</span>
          </label>
        ) : null}
        {preview.quarantinedCount > 0 ? (
          <label className="flex items-start gap-2 rounded-md bg-control/55 p-3 text-sm">
            <input name="acknowledgeQuarantine" required type="checkbox" />
            <span>
              Прегледах {preview.quarantinedCount} реда под карантина.
            </span>
          </label>
        ) : null}
        <Button className="w-full" disabled={!canApprove} type="submit">
          Одобряване и добавяне за прилагане
        </Button>
      </form>
    ) : null}
    {canApproveRole ? null : (
      <p className="mt-3 text-destructive text-xs">
        Вашата записана роля не може да одобри тази снимка.
      </p>
    )}
    {fullSnapshotHeld ? (
      <p className="mt-3 text-destructive text-xs">
        Пълните снимки не могат да съгласуват липси, докато има редове под
        карантина.
      </p>
    ) : null}
    {preview && !previewCurrent ? (
      <p className="mt-3 text-destructive text-xs">
        Срокът на този преглед е изтекъл и той трябва да бъде генериран отново.
      </p>
    ) : null}
  </section>
);

const ImportProcessingCard = ({
  session,
}: {
  readonly session: ImportSession;
}) => {
  const completedChunks = session.chunks.filter(
    (chunk) =>
      chunk.status === "completed" || chunk.status === "completed_with_issues"
  ).length;

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="font-semibold text-sm">Състояние на обработката</h2>
      <p className="mt-2 text-muted-foreground text-sm">
        {session.chunkCount > 0
          ? `${completedChunks}/${session.chunkCount} части са завършени.`
          : "Все още няма генериран от сървъра план на частите."}
      </p>
      <p className="mt-2 text-muted-foreground text-xs">
        Последният надежден инвентар от източника се запазва до успешно
        завършване. Заявка за прилагане не означава приложен импорт.
      </p>
    </section>
  );
};

const ImportSessionPage = async ({
  params,
  searchParams,
}: {
  readonly params: Promise<{ sessionId: string }>;
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const [actor, route, query] = await Promise.all([
    requireDealerOrganizationActor(["owner", "manager", "sales", "viewer"]),
    params,
    searchParams,
  ]);
  const session = await database.inventoryImportSession.findFirst({
    include: importSessionInclude,
    where: { dealerOrgId: actor.dealerOrgId, id: route.sessionId },
  });
  if (!session) {
    notFound();
  }
  const preview = session.previews[0];
  const artifact = session.artifacts.find(
    (candidate) => candidate.kind === "original"
  );
  const stateView = getImportSessionStatusView({
    expiresAt: session.expiresAt.toISOString(),
    status: session.status,
  });
  const message = query.state ? messages[query.state] : undefined;
  const previewCurrent = Boolean(preview && preview.expiresAt > new Date());
  const canApproveRole =
    actor.role === "owner" ||
    actor.role === "manager" ||
    (actor.role === "sales" && session.mode === "incremental");
  const fullSnapshotHeld =
    session.mode === "full_snapshot" &&
    Boolean(preview && preview.quarantinedCount > 0);
  const canApprove =
    session.status === "ready" &&
    previewCurrent &&
    Boolean(preview && preview.blockingCount === 0) &&
    canApproveRole &&
    !fullSnapshotHeld;
  const canGeneratePreviewRole = actor.role !== "viewer";
  const previewableStatus = [
    "mapping_required",
    "preview_queued",
    "previewing",
    "ready",
  ].includes(session.status);
  const hasTrustedPreviewMaterial =
    artifact?.scanStatus === "clean" && Boolean(session.mappingVersion);
  const canGeneratePreview =
    canGeneratePreviewRole &&
    previewableStatus &&
    hasTrustedPreviewMaterial &&
    session.expiresAt > new Date() &&
    dealerProviderReadiness.privateStorage === "configured";
  const successMessage =
    query.state === "apply_queued" || query.state === "preview_generated";

  return (
    <>
      <ImporterPageHeader page="Преглед на импорта" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <ImportStateMessage message={message} success={successMessage} />
        <section className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                {session.inventorySource.name}
              </p>
              <h1 className="mt-1 font-semibold text-lg">
                {session.logicalBatchId}
              </h1>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                {session.id}
              </p>
            </div>
            <Badge variant={stateView.tone}>{stateView.label}</Badge>
          </div>
          <p className="mt-3 text-muted-foreground text-sm">
            {stateView.detail}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground text-xs">Режим</dt>
              <dd className="mt-1 font-medium text-sm">
                {formatImporterToken(session.mode)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">
                Пълнота на снимката
              </dt>
              <dd className="mt-1 font-medium text-sm">
                {session.completeSnapshot ? "Изрично пълна" : "Непълна"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Създадено</dt>
              <dd className="mt-1 font-medium text-sm">
                {formatImporterTimestamp(session.createdAt.toISOString())}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Изтича</dt>
              <dd className="mt-1 font-medium text-sm">
                {formatImporterTimestamp(session.expiresAt.toISOString())}
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <ImportMaterialSummary artifact={artifact} session={session} />

            <ImportPreviewSection
              preview={preview}
              sessionStatus={session.status}
            />
          </div>

          <aside className="space-y-4">
            <PreviewGenerationCard
              artifact={artifact}
              canGeneratePreview={canGeneratePreview}
              canGeneratePreviewRole={canGeneratePreviewRole}
              preview={preview}
              previewCurrent={previewCurrent}
              session={session}
            />
            <ImportApprovalCard
              canApprove={canApprove}
              canApproveRole={canApproveRole}
              fullSnapshotHeld={fullSnapshotHeld}
              preview={preview}
              previewCurrent={previewCurrent}
              session={session}
            />
            <ImportProcessingCard session={session} />
            <Alert
              variant={
                dealerProviderReadiness.privateStorage === "configured"
                  ? "default"
                  : "destructive"
              }
            >
              <ShieldAlertIcon />
              <AlertTitle>
                Хранилище: {dealerProviderReadiness.privateStorage}
              </AlertTitle>
              <AlertDescription>
                Съществуващите трайни данни остават видими. Нови прочитания и
                качвания не могат да се изпълнят, докато частният доставчик не е
                достъпен.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dealer/inventory/runs">Назад към историята</Link>
            </Button>
          </aside>
        </div>
      </main>
    </>
  );
};

export default ImportSessionPage;
