import { getActiveListingQuotaView } from "@repo/database/commerce";
import { listDealerInventoryRows } from "@repo/database/dealer-studio";
import { Button } from "@repo/design-system/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicWebBaseUrl } from "../../marketplace-url";
import { InventoryQuotaAlert } from "../entitlements/inventory-quota-alert";
import { DealerInventoryList } from "./components/dealer-inventory-list";
import { ImporterPageHeader } from "./components/importer-page-header";
import { ImporterWorkspaceChrome } from "./components/importer-workspace-chrome";
import { requireImporterWorkspaceOverview } from "./importer-data";

export const metadata: Metadata = {
  title: "Дилърски инвентар",
  description: "Управление на дилърския инвентар.",
};

interface DealerInventoryPageProperties {
  searchParams: Promise<{
    cursor?: string | string[];
    quota?: string | string[];
  }>;
}

const getFirstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value.at(0) : value;

const DealerInventoryPage = async ({
  searchParams,
}: DealerInventoryPageProperties) => {
  const overview = await requireImporterWorkspaceOverview();
  const params = await searchParams;
  const [inventoryPage, quotaView] = await Promise.all([
    listDealerInventoryRows(overview.organization.id, {
      cursor: getFirstValue(params.cursor),
    }),
    getActiveListingQuotaView({
      id: overview.organization.id,
      kind: "dealer_org",
    }),
  ]);
  const webBaseUrl = getPublicWebBaseUrl();
  const now = new Date();

  return (
    <>
      <ImporterPageHeader page="Инвентар" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <ImporterWorkspaceChrome
          activeView="inventory"
          heading="Инвентар"
          now={now}
          overview={overview}
        />
        <InventoryQuotaAlert
          requestedCode={getFirstValue(params.quota)}
          view={quotaView}
        />
        <DealerInventoryList
          inventory={inventoryPage.items}
          webBaseUrl={webBaseUrl}
        />
        {inventoryPage.nextCursor ? (
          <div className="flex justify-end">
            <Button asChild variant="secondary">
              <Link
                href={`/dealer/inventory?cursor=${encodeURIComponent(
                  inventoryPage.nextCursor
                )}`}
              >
                Следваща страница
              </Link>
            </Button>
          </div>
        ) : null}
      </main>
    </>
  );
};

export default DealerInventoryPage;
