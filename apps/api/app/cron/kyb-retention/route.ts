import { env } from "@/env";
import { purgeKybRetention } from "@/lib/kyb-workers";
import { privateObjectStorageProvider } from "@/lib/provider-adapters";
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
  if (env.AUTOMARKET_ENABLE_KYB_RETENTION !== "true") {
    return serviceJson({ capability: "kyb_retention", status: "disabled" });
  }
  try {
    const result = await purgeKybRetention(
      privateObjectStorageProvider,
      boundedLimit(new URL(request.url).searchParams.get("limit"), 25, 100)
    );
    return serviceJson(
      result,
      result.status === "storage_unconfigured" ? 503 : 200
    );
  } catch {
    return serviceJson({ error: "kyb_retention_failed" }, 500);
  }
};
