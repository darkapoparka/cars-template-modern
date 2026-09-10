import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { getCorrelationId } from "@repo/observability/request-context";

const actionFieldPrefix = "$ACTION_";
const maxForwardedIpLength = 64;

type HeaderReader = Pick<Headers, "get">;

export interface PublicRequestContext {
  readonly correlationId: string;
  readonly ipKey: string;
  readonly sameOrigin: boolean;
}

export const fingerprintPublicValue = (scope: string, value: string): string =>
  createHash("sha256")
    .update(`${scope}:${value.trim().toLowerCase()}`)
    .digest("hex");

const normalizeClientIp = (value: string | null): string => {
  const candidate = value?.split(",")[0]?.trim() ?? "";
  return candidate.length <= maxForwardedIpLength && isIP(candidate)
    ? candidate
    : "unknown";
};

const isSameOrigin = (headers: HeaderReader): boolean => {
  const origin = headers.get("origin");
  const host =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headers.get("host")?.trim();

  if (!(origin && host)) {
    return false;
  }

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
};

export const getPublicRequestContext = (
  headers: HeaderReader
): PublicRequestContext => {
  const ip = normalizeClientIp(
    headers.get("x-forwarded-for") ?? headers.get("x-real-ip")
  );

  return {
    correlationId: getCorrelationId(headers),
    ipKey: fingerprintPublicValue("public-form-ip", ip),
    sameOrigin: isSameOrigin(headers),
  };
};

export const inspectPublicFormData = (
  formData: FormData,
  options: {
    readonly allowedFields: ReadonlySet<string>;
    readonly maxBytes: number;
  }
): boolean => {
  const encoder = new TextEncoder();
  const seen = new Set<string>();
  let byteSize = 0;

  for (const [key, value] of formData.entries()) {
    if (seen.has(key) || typeof value !== "string") {
      return false;
    }

    seen.add(key);
    byteSize +=
      encoder.encode(key).byteLength + encoder.encode(value).byteLength;
    if (byteSize > options.maxBytes) {
      return false;
    }

    if (key.startsWith(actionFieldPrefix)) {
      continue;
    }
    if (!options.allowedFields.has(key)) {
      return false;
    }
  }

  return true;
};
