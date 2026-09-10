export const CORRELATION_ID_HEADER = "x-correlation-id";

const correlationIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

type HeaderReader = Pick<Headers, "get">;

const readHeader = (
  headers: HeaderReader | Record<string, string | undefined> | undefined,
  name: string
): string | undefined => {
  if (!headers) {
    return undefined;
  }

  if ("get" in headers && typeof headers.get === "function") {
    return headers.get(name) ?? undefined;
  }

  const entries = Object.entries(headers);
  return entries.find(([key]) => key.toLowerCase() === name)?.[1];
};

export const isValidCorrelationId = (value: string): boolean =>
  correlationIdPattern.test(value);

export const getCorrelationId = (
  headers?: HeaderReader | Record<string, string | undefined>
): string => {
  const candidate = readHeader(headers, CORRELATION_ID_HEADER)?.trim();

  return candidate && isValidCorrelationId(candidate)
    ? candidate
    : globalThis.crypto.randomUUID();
};

export const attachCorrelationId = (
  response: Response,
  correlationId: string
): Response => {
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
};
