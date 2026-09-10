const REDACTED = "[REDACTED]";

interface RedactionOptions {
  readonly preserveSentryFrameFilenames: boolean;
}

const sensitiveKeyFragments = [
  "address",
  "authorization",
  "body",
  "contact",
  "cookie",
  "credential",
  "databaseurl",
  "description",
  "details",
  "documentname",
  "email",
  "eori",
  "filename",
  "firstname",
  "lastname",
  "legalname",
  "message",
  "password",
  "payload",
  "phone",
  "providerpayload",
  "registrationnumber",
  "secret",
  "session",
  "signedurl",
  "storagekey",
  "objectkey",
  "taxid",
  "token",
  "vatid",
] as const;

const normalizeKey = (key: string): string =>
  key.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

export const isSensitiveLogKey = (key: string): boolean => {
  const normalized = normalizeKey(key);

  return sensitiveKeyFragments.some((fragment) =>
    normalized.includes(fragment)
  );
};

const isSensitiveQueryParameter = (key: string): boolean => {
  const normalized = normalizeKey(key);

  return (
    normalized === "sig" ||
    ["credential", "key", "password", "secret", "signature", "token"].some(
      (fragment) => normalized.includes(fragment)
    )
  );
};

export const redactText = (value: string): string =>
  value
    .replaceAll(/[\r\n\u2028\u2029]+/g, " ")
    .replaceAll(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, `$1 ${REDACTED}`)
    .replaceAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, REDACTED)
    .replaceAll(/\+?\d[\d\s().-]{7,}\d/g, REDACTED)
    .replaceAll(
      /(^|[?&\s])([^=?&\s]+)=([^&\s]*)/g,
      (match, prefix: string, key: string) =>
        isSensitiveQueryParameter(key) ? `${prefix}${key}=${REDACTED}` : match
    )
    .replaceAll(
      /([a-z][a-z0-9+.-]*:\/\/)([^\s:/]+):([^\s@/]+)@/gi,
      `$1${REDACTED}:${REDACTED}@`
    );

const redactRecord = (
  value: Record<string, unknown>,
  seen: WeakSet<object>,
  path: readonly string[],
  options: RedactionOptions
): Record<string, unknown> => {
  if (seen.has(value)) {
    return { circular: REDACTED };
  }

  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      const isSentryFrameFilename =
        options.preserveSentryFrameFilenames &&
        normalizeKey(key) === "filename" &&
        path.at(-2) === "frames";

      return [
        key,
        isSensitiveLogKey(key) && !isSentryFrameFilename
          ? REDACTED
          : redactValue(entry, seen, [...path, key], options),
      ];
    })
  );
};

const redactValue = (
  value: unknown,
  seen: WeakSet<object>,
  path: readonly string[],
  options: RedactionOptions
): unknown => {
  if (typeof value === "string") {
    return redactText(value);
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message),
    };
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return { circular: REDACTED };
    }
    seen.add(value);
    return value.map((entry, index) =>
      redactValue(entry, seen, [...path, String(index)], options)
    );
  }

  if (value && typeof value === "object") {
    return redactRecord(value as Record<string, unknown>, seen, path, options);
  }

  return value;
};

export const redactLogValue = (
  value: unknown,
  seen = new WeakSet<object>()
): unknown =>
  redactValue(value, seen, [], { preserveSentryFrameFilenames: false });

export const sanitizeLogArguments = (values: readonly unknown[]): unknown[] =>
  values.map((value) => redactLogValue(value));

export const sanitizeTelemetryEvent = <T>(event: T): T =>
  redactValue(event, new WeakSet<object>(), [], {
    preserveSentryFrameFilenames: true,
  }) as T;
