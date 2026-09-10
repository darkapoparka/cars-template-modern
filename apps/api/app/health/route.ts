import {
  attachCorrelationId,
  getCorrelationId,
} from "@repo/observability/request-context";

export const GET = (request?: Request): Response => {
  const correlationId = getCorrelationId(request?.headers);
  const response = Response.json(
    { service: "automarket-api", status: "ok" },
    {
      headers: { "cache-control": "no-store" },
      status: 200,
    }
  );

  return attachCorrelationId(response, correlationId);
};
