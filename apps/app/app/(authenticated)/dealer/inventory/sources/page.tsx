import { listOrganizationInventorySources } from "@repo/database/inventory-sources";
import type { Metadata } from "next";
import { requireDealerOrganizationActor } from "../../actor";
import { dealerProviderReadiness } from "../../provider-adapters";
import { ImporterPageHeader } from "../components/importer-page-header";
import { ImporterWorkspaceChrome } from "../components/importer-workspace-chrome";
import { SourceManagementList } from "../components/source-management-list";
import { requireImporterWorkspaceOverview } from "../importer-data";

export const metadata: Metadata = {
  title: "Източници на инвентар",
  description: "Състояние на източниците на инвентар в Dealer Studio.",
};

const InventorySourcesPage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<{ state?: string }>;
}) => {
  const [overview, actor, params] = await Promise.all([
    requireImporterWorkspaceOverview(),
    requireDealerOrganizationActor(),
    searchParams,
  ]);
  const sources = await listOrganizationInventorySources(actor.dealerOrgId);
  const sourceViews = sources.map((source) => ({
    configVersion: source.configVersion,
    credentialBindings: source.credentialBindings.map((binding) => ({
      purpose: binding.purpose,
      retiringUntil: binding.retiringUntil?.toISOString(),
      status: binding.status,
      verifiedAt: binding.verifiedAt?.toISOString(),
      version: binding.version,
    })),
    credentialHealthStatus: source.credentialHealthStatus ?? "not_configured",
    id: source.id,
    kind: source.kind,
    lastSuccessfulSyncAt: source.lastSuccessfulSyncAt?.toISOString(),
    name: source.name,
    sourceKey: source.sourceKey,
    status: source.status,
    syncMode: source.syncMode,
  }));

  return (
    <>
      <ImporterPageHeader page="Източници" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <ImporterWorkspaceChrome
          activeView="sources"
          heading="Източници"
          now={new Date()}
          overview={overview}
        />
        <SourceManagementList
          canManage={actor.role === "owner" || actor.role === "manager"}
          credentialProvider={dealerProviderReadiness.credentials}
          sources={sourceViews}
          state={params.state}
        />
      </main>
    </>
  );
};

export default InventorySourcesPage;
