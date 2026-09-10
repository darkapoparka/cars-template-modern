import type { InventorySourceHealthRow } from "@repo/database/inventory-health";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { HistoryIcon, RefreshCwIcon } from "lucide-react";
import {
  formatImporterTimestamp,
  formatImporterToken,
  getInventorySourceHealthView,
} from "../importer-view-state";

interface ImportRunListProps {
  readonly sources: readonly InventorySourceHealthRow[];
}

export const ImportRunList = ({ sources }: ImportRunListProps) => (
  <section
    aria-labelledby="runs-heading"
    className="overflow-hidden rounded-lg border bg-card"
  >
    <div className="flex items-start justify-between gap-3 p-4">
      <div>
        <h2 className="font-semibold text-sm" id="runs-heading">
          Последни импортирания
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Най-скорошният записан опит за всеки източник на инвентар.
        </p>
      </div>
      <Badge variant="secondary">
        {sources.length} {sources.length === 1 ? "източник" : "източника"}
      </Badge>
    </div>

    {sources.length === 0 ? (
      <Empty className="rounded-none border-x-0 border-b-0 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle>Няма импортирания</EmptyTitle>
          <EmptyDescription>
            Опитите за импорт ще се покажат след регистриране и стартиране на
            източник.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ) : (
      <div className="divide-y border-t">
        {sources.map((source) => {
          const run = source.latestRun;
          const health = getInventorySourceHealthView(source);

          return (
            <article className="p-4" key={source.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-sm">{source.name}</h3>
                    <Badge variant={health.latestRun.tone}>
                      {health.latestRun.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {formatImporterToken(source.kind)} ·{" "}
                    {formatImporterToken(source.syncMode)}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  Последно успешно:{" "}
                  {formatImporterTimestamp(source.lastSuccessfulSyncAt)}
                </p>
              </div>

              {run ? (
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
                  {[
                    ["Начало", formatImporterTimestamp(run.startedAt)],
                    [
                      "Край",
                      run.completedAt
                        ? formatImporterTimestamp(run.completedAt)
                        : "В изпълнение",
                    ],
                    ["Получени", run.receivedCount.toLocaleString("bg-BG")],
                    ["Променени", run.changedCount.toLocaleString("bg-BG")],
                    ["Отхвърлени", run.rejectedCount.toLocaleString("bg-BG")],
                    ["Прогнозни", run.projectedCount.toLocaleString("bg-BG")],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="mt-1 font-medium text-sm">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className="mt-4 flex items-center gap-2 bg-control/55 px-3 py-2 text-muted-foreground text-sm">
                  <RefreshCwIcon className="size-4" />
                  Очаква се първият опит за импорт.
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 bg-control/55 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Съгласуване
                  </span>
                  <Badge variant={health.reconciliation.tone}>
                    {health.reconciliation.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {health.reconciliation.detail}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </section>
);
