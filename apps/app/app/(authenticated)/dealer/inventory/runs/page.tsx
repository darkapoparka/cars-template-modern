import { listInventoryImportHistory } from "@repo/database/inventory-imports";
import type { Metadata } from "next";
import { requireDealerOrganizationActor } from "../../actor";
import { ImportRunList } from "../components/import-run-list";
import { ImportSessionList } from "../components/import-session-list";
import { ImporterPageHeader } from "../components/importer-page-header";
import { ImporterWorkspaceChrome } from "../components/importer-workspace-chrome";
import { requireImporterWorkspaceOverview } from "../importer-data";

export const metadata: Metadata = {
  title: "История на импортирането",
  description: "Последни импортирания на инвентар в Dealer Studio.",
};

const ImportRunsPage = async () => {
  const [overview, actor] = await Promise.all([
    requireImporterWorkspaceOverview(),
    requireDealerOrganizationActor(),
  ]);
  const sessions = await listInventoryImportHistory({
    dealerOrgId: actor.dealerOrgId,
    limit: 50,
  });
  const sourceNames = new Map(
    overview.sources.map((source) => [source.id, source.name])
  );
  const sessionViews = sessions.map((session) => ({
    completeSnapshot: session.completeSnapshot,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    id: session.id,
    logicalBatchId: session.logicalBatchId,
    mode: session.mode,
    preview: session.previews[0]
      ? {
          blockingCount: session.previews[0].blockingCount,
          missingCount: session.previews[0].missingCount,
          projectedPublicationCount:
            session.previews[0].projectedPublicationCount,
          quarantinedCount: session.previews[0].quarantinedCount,
          validCount: session.previews[0].validCount,
          wouldUnpublishCount: session.previews[0].wouldUnpublishCount,
        }
      : undefined,
    sourceName:
      sourceNames.get(session.inventorySourceId) ?? "Източник на инвентар",
    status: session.status,
  }));

  return (
    <>
      <ImporterPageHeader page="История на импортирането" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <ImporterWorkspaceChrome
          activeView="runs"
          heading="История на импортирането"
          now={new Date()}
          overview={overview}
        />
        <ImportRunList sources={overview.sources} />
        <ImportSessionList sessions={sessionViews} />
      </main>
    </>
  );
};

export default ImportRunsPage;
