import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { FileClockIcon, FileSpreadsheetIcon } from "lucide-react";
import Link from "next/link";
import {
  formatImporterTimestamp,
  formatImporterToken,
  type ImporterStatusTone,
} from "../importer-view-state";

export interface ImportSessionViewModel {
  readonly completeSnapshot: boolean;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly id: string;
  readonly logicalBatchId: string;
  readonly mode: string;
  readonly preview?: {
    readonly blockingCount: number;
    readonly missingCount: number;
    readonly projectedPublicationCount: number;
    readonly quarantinedCount: number;
    readonly validCount: number;
    readonly wouldUnpublishCount: number;
  };
  readonly sourceName: string;
  readonly status: string;
}

export const getImportSessionStatusView = (
  session: Pick<ImportSessionViewModel, "expiresAt" | "status">,
  now = new Date()
): {
  readonly detail: string;
  readonly label: string;
  readonly tone: ImporterStatusTone;
} => {
  if (
    new Date(session.expiresAt).getTime() <= now.getTime() &&
    ![
      "applied",
      "applied_with_issues",
      "failed",
      "cancelled",
      "expired",
    ].includes(session.status)
  ) {
    return {
      detail: "Срокът на валидност на сесията за качване изтече",
      label: "Изтекла",
      tone: "destructive",
    };
  }
  if (session.status === "created") {
    return {
      detail: "Сесията е създадена и очаква частния файл",
      label: "Създадена",
      tone: "secondary",
    };
  }
  if (session.status === "uploaded") {
    return {
      detail: "Частният файл е качен и очаква сканиране",
      label: "Качена",
      tone: "info",
    };
  }
  if (session.status === "scan_pending") {
    return {
      detail:
        "Частният файл остава под карантина до получаване на доказателство от скенера",
      label: "Очаква сканиране",
      tone: "info",
    };
  }
  if (session.status === "mapping_required") {
    return {
      detail:
        "Чистият файл се нуждае от канонично съпоставяне и надежден преглед",
      label: "Нужно е съпоставяне",
      tone: "warning",
    };
  }
  if (["preview_queued", "previewing"].includes(session.status)) {
    return {
      detail: "Изчислява се надеждният преглед",
      label: "Очаква преглед",
      tone: "info",
    };
  }
  if (session.status === "ready") {
    return {
      detail: "Прегледайте обвързания преглед преди одобрение",
      label: "Готова за одобрение",
      tone: "success",
    };
  }
  if (["apply_queued", "applying"].includes(session.status)) {
    return {
      detail:
        "Прилагането е в опашката или се обработва със заключване на източника",
      label: "Прилага се",
      tone: "info",
    };
  }
  if (session.status === "applied") {
    return {
      detail: "Всички трайни части са завършени без проблеми",
      label: "Приложена",
      tone: "success",
    };
  }
  if (session.status === "applied_with_issues") {
    return {
      detail: "Завършена е със записани карантини или проблеми",
      label: "Приложена с проблеми",
      tone: "warning",
    };
  }
  if (session.status === "failed") {
    return {
      detail: "Опитът е неуспешен; последният надежден инвентар остава водещ",
      label: "Неуспешна",
      tone: "destructive",
    };
  }
  if (session.status === "cancelled") {
    return {
      detail: "Сесията беше отменена",
      label: "Отменена",
      tone: "secondary",
    };
  }
  if (session.status === "expired") {
    return {
      detail: "Срокът на валидност на сесията за качване изтече",
      label: "Изтекла",
      tone: "destructive",
    };
  }
  return {
    detail: `Състояние на процеса: ${formatImporterToken(session.status)}`,
    label: formatImporterToken(session.status),
    tone: "secondary",
  };
};

export const ImportSessionList = ({
  sessions,
  now = new Date(),
}: {
  readonly sessions: readonly ImportSessionViewModel[];
  readonly now?: Date;
}) => (
  <section className="overflow-hidden rounded-lg border bg-card">
    <div className="flex items-start justify-between gap-3 p-4">
      <div>
        <h2 className="font-semibold text-sm">История на CSV импортите</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Надеждни състояния за качване, сканиране, съпоставяне, преглед,
          одобрение и прилагане.
        </p>
      </div>
      <Badge variant="secondary">{sessions.length} сесии</Badge>
    </div>
    {sessions.length === 0 ? (
      <div className="border-t p-10 text-center">
        <FileClockIcon className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-2 font-medium text-sm">Няма сесии за CSV импорт</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Първото защитено качване ще създаде сесия.
        </p>
      </div>
    ) : (
      <div className="divide-y border-t">
        {sessions.map((session) => {
          const status = getImportSessionStatusView(session, now);
          return (
            <article className="p-4" key={session.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-control">
                    <FileSpreadsheetIcon className="size-4" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-sm">
                        {session.sourceName}
                      </h3>
                      <Badge variant={status.tone}>{status.label}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {session.logicalBatchId}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {formatImporterToken(session.mode)}
                      {session.completeSnapshot ? " · изрично пълна" : ""} ·
                      създадена {formatImporterTimestamp(session.createdAt)}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dealer/inventory/imports/${session.id}`}>
                    Преглед
                  </Link>
                </Button>
              </div>
              <p className="mt-3 text-muted-foreground text-xs">
                {status.detail}
              </p>
              {session.preview ? (
                <dl className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-control/55 p-3 sm:grid-cols-6">
                  {[
                    ["Валидни", session.preview.validCount],
                    ["Под карантина", session.preview.quarantinedCount],
                    ["Блокиращи", session.preview.blockingCount],
                    ["Липсващи", session.preview.missingCount],
                    ["За сваляне", session.preview.wouldUnpublishCount],
                    ["Прогнозни", session.preview.projectedPublicationCount],
                  ].map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-[11px] text-muted-foreground">
                        {key}
                      </dt>
                      <dd className="mt-0.5 font-semibold text-sm">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          );
        })}
      </div>
    )}
  </section>
);
