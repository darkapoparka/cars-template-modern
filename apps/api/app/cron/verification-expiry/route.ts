import { env } from "@/env";
import { expireVerificationGrants } from "@/lib/kyb-workers";
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
  try {
    return serviceJson(
      await expireVerificationGrants(
        boundedLimit(new URL(request.url).searchParams.get("limit"))
      )
    );
  } catch {
    return serviceJson({ error: "verification_expiry_failed" }, 500);
  }
};
