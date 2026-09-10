import {
  claimMediaPendingCleanup,
  completeMediaCleanup,
  failMediaCleanup,
} from "@repo/database/media";
import { log } from "@repo/observability/log";
import { verifyBearerSecret } from "@repo/security/request-auth";
import { del } from "@repo/storage";
import { env } from "@/env";
import { serviceJson } from "@/lib/service-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const handleCleanup = async (request: Request) => {
  const verification = verifyBearerSecret(
    request.headers.get("authorization"),
    env.CRON_SECRET
  );
  if (verification === "not_configured") {
    return serviceJson({ error: "cron_not_configured" }, 503);
  }
  if (verification === "invalid") {
    return serviceJson({ error: "unauthorized" }, 401);
  }
  if (!env.BLOB_READ_WRITE_TOKEN) {
    return serviceJson({ error: "blob_not_configured" }, 503);
  }

  const pending = await claimMediaPendingCleanup(50);
  let completed = 0;
  let failed = 0;
  for (const image of pending) {
    try {
      await del(image.url, { token: env.BLOB_READ_WRITE_TOKEN });
      const finalized = await completeMediaCleanup(image.id);
      if (finalized.count !== 1) {
        throw new Error("media_cleanup_lease_lost");
      }
      completed += 1;
    } catch (error) {
      await failMediaCleanup(image.id);
      log.warn("Listing media cleanup item failed", {
        errorType: error instanceof Error ? error.name : typeof error,
        imageId: image.id,
      });
      failed += 1;
    }
  }

  return Response.json(
    { completed, failed, inspected: pending.length },
    {
      headers: { "Cache-Control": "no-store" },
      status: failed > 0 ? 500 : 200,
    }
  );
};

export const GET = handleCleanup;
export const POST = handleCleanup;
