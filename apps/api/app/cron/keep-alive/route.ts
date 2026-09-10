import { database } from "@repo/database";
import { env } from "@/env";
import { authorizeServiceRequest, serviceJson } from "@/lib/service-auth";

export const GET = async (request: Request) => {
  const auth = authorizeServiceRequest(request, env.CRON_SECRET);
  if (auth) {
    return auth;
  }

  await database.$queryRaw`SELECT 1`;

  return serviceJson({ ok: true });
};
