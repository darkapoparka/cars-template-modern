import { reconcileStaleInventory } from "@repo/database/inventory-ingestion";
import { verifyBearerSecret } from "@repo/security/request-auth";
import { env } from "@/env";

export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = async (request: Request): Promise<Response> => {
  const verification = verifyBearerSecret(
    request.headers.get("authorization"),
    env.CRON_SECRET
  );

  if (verification === "not_configured") {
    return Response.json(
      { error: "cron_not_configured" },
      { headers: { "Cache-Control": "no-store" }, status: 503 }
    );
  }
  if (verification === "invalid") {
    return Response.json(
      { error: "unauthorized" },
      { headers: { "Cache-Control": "no-store" }, status: 401 }
    );
  }

  try {
    const result = await reconcileStaleInventory();
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
      status: 200,
    });
  } catch {
    return Response.json(
      { error: "inventory_reconciliation_failed" },
      { headers: { "Cache-Control": "no-store" }, status: 500 }
    );
  }
};
