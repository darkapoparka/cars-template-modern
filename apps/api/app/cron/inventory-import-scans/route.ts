import { env } from "@/env";
import { submitInventoryArtifactScans } from "@/lib/inventory-import-workers";
import { inventoryArtifactScanner } from "@/lib/provider-adapters";
import {
  authorizeServiceRequest,
  boundedLimit,
  serviceJson,
} from "@/lib/service-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = async (request: Request): Promise<Response> => {
  const auth = authorizeServiceRequest(request, env.CRON_SECRET);
  if (auth) {
    return auth;
  }
  if (env.AUTOMARKET_ENABLE_PRIVATE_IMPORTS !== "true") {
    return serviceJson({
      capability: "private_inventory_imports",
      status: "disabled",
    });
  }
  try {
    const result = await submitInventoryArtifactScans(
      inventoryArtifactScanner,
      boundedLimit(new URL(request.url).searchParams.get("limit"), 10, 50)
    );
    return serviceJson(
      result,
      result.status === "scanner_unconfigured" ? 503 : 200
    );
  } catch {
    return serviceJson({ error: "inventory_import_scan_worker_failed" }, 500);
  }
};
