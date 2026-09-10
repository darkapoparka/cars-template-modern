import { env } from "@/env";
import {
  recoverClerkProvisioning,
  recoverExternalIdentitySync,
} from "@/lib/auth-recovery";
import { clerkRecoveryAdapter } from "@/lib/provider-adapters";
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
  if (env.AUTOMARKET_ENABLE_AUTH_RECOVERY !== "true") {
    return serviceJson({ capability: "auth_recovery", status: "disabled" });
  }
  const limit = boundedLimit(
    new URL(request.url).searchParams.get("limit"),
    25,
    100
  );
  try {
    const [identity, provisioning] = await Promise.all([
      recoverExternalIdentitySync(clerkRecoveryAdapter, limit),
      recoverClerkProvisioning(clerkRecoveryAdapter, limit),
    ]);
    const unavailable =
      identity.status === "adapter_unconfigured" ||
      provisioning.status === "adapter_unconfigured";
    return serviceJson(
      { identity, provisioning, status: unavailable ? "degraded" : "ok" },
      unavailable ? 503 : 200
    );
  } catch {
    return serviceJson({ error: "auth_recovery_failed" }, 500);
  }
};
