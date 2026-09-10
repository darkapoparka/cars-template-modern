type Environment = Readonly<Record<string, string | undefined>>;

const firstNonBlankValue = (
  environment: Environment,
  names: readonly string[]
): string | undefined => {
  for (const name of names) {
    const value = environment[name]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
};

const isHttpUrl = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Better Stack's Next.js logger uses transport credentials that are separate
 * from the uptime API key and public status URL used by the Status component.
 * A browser custom endpoint is not sufficient for server logging: the logger
 * still needs a source token and ingest URL for server-side events. Keep the
 * integration dormant unless that complete transport is available.
 */
export const isBetterStackLoggingConfigured = (
  environment: Environment = process.env
): boolean => {
  const sourceToken = firstNonBlankValue(environment, [
    "BETTER_STACK_SOURCE_TOKEN",
  ]);
  const ingestingUrl = firstNonBlankValue(environment, [
    "BETTER_STACK_INGESTING_URL",
  ]);

  return Boolean(sourceToken) && isHttpUrl(ingestingUrl);
};
