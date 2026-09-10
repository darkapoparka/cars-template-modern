import { env } from "@/env";
import { processInventoryImports } from "@/lib/inventory-import-workers";
import { privateObjectStorageProvider } from "@/lib/provider-adapters";
import {
  authorizeServiceRequest,
  boundedLimit,
  serviceJson,
} from "@/lib/service-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    const result = await processInventoryImports(
      privateObjectStorageProvider,
      boundedLimit(new URL(request.url).searchParams.get("limit"), 5, 25)
    );
    return serviceJson(
      result,
      result.status === "storage_unconfigured" ? 503 : 200
    );
  } catch {
    return serviceJson({ error: "inventory_import_worker_failed" }, 500);
  }
};
