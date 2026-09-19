// Pure environment parsing and validation; no filesystem or provider operations.

const placeholderPattern =
  /(placeholder|replace[-_ ]?me|change[-_ ]?me|your[-_ ]|dummy|invalid|example\.(com|org|net)|^x+$|^todo$)/i;

const envLinePattern = /^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/;

const emailPattern =
  /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/u;

const lineBreakPattern = /\r?\n/;

const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

const ipv4LoopbackPattern = /^127(?:\.\d{1,3}){3}$/u;

const ipv4LiteralPattern = /^(?:\d{1,3}\.){3}\d{1,3}$/u;

const bracketedIpLiteralPattern = /^\[[0-9a-f:.]+\]$/iu;

const ipv4MappedLoopbackPattern = /^\[::ffff:7f[0-9a-f]{2}:/iu;

const reservedDeploymentHostSuffixes = [
  "example",
  "example.com",
  "example.net",
  "example.org",
  "invalid",
  "local",
  "localhost",
  "test",
];

export const parseEnvText = (source) => {
  const environment = {};

  for (const sourceLine of source.split(lineBreakPattern)) {
    const line = sourceLine.trim();
    if (!(line && !line.startsWith("#"))) {
      continue;
    }

    const match = envLinePattern.exec(line);
    if (!match) {
      continue;
    }

    const [, name, rawValue = ""] = match;
    if (Object.hasOwn(environment, name)) {
      throw new Error(`duplicate environment variable: ${name}`);
    }
    const value = rawValue.trim();
    const hasMatchingQuotes =
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")));
    environment[name] = hasMatchingQuotes ? value.slice(1, -1) : value;
  }

  return environment;
};

export const isConfigured = (value, minimumLength = 1) => {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  return (
    value === trimmed &&
    trimmed.length >= minimumLength &&
    !placeholderPattern.test(trimmed)
  );
};

export const isPresent = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const isReservedDeploymentHost = (hostname) => {
  const normalized = hostname.toLowerCase();
  return (
    normalized.endsWith(".") ||
    normalized === "0.0.0.0" ||
    normalized === "[::]" ||
    ipv4LiteralPattern.test(normalized) ||
    bracketedIpLiteralPattern.test(normalized) ||
    ipv4LoopbackPattern.test(normalized) ||
    ipv4MappedLoopbackPattern.test(normalized) ||
    reservedDeploymentHostSuffixes.some(
      (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`)
    )
  );
};

export const parseUrl = (value) => {
  if (!isConfigured(value)) {
    return undefined;
  }

  try {
    return new URL(value);
  } catch {
    return undefined;
  }
};

export const isRemoteHttpsOrigin = (value) => {
  const url = parseUrl(value);
  return Boolean(
    url &&
      url.protocol === "https:" &&
      !localHosts.has(url.hostname) &&
      !isReservedDeploymentHost(url.hostname) &&
      value.trim() === url.origin &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
  );
};

export const isRemotePostgresUrl = (value) => {
  const url = parseUrl(value);
  let databaseName;
  try {
    databaseName = url ? decodeURIComponent(url.pathname) : undefined;
  } catch {
    return false;
  }
  return Boolean(
    url &&
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      !localHosts.has(url.hostname) &&
      !isReservedDeploymentHost(url.hostname) &&
      url.username &&
      url.password &&
      databaseName &&
      databaseName.length > 1 &&
      !url.hash
  );
};

export const databaseIdentity = (value) => {
  if (!isRemotePostgresUrl(value)) {
    return undefined;
  }

  const url = new URL(value);
  try {
    const databaseName = decodeURIComponent(url.pathname);
    return `${url.hostname.toLowerCase()}:${url.port || "5432"}${databaseName}`;
  } catch {
    return undefined;
  }
};

export const isEmail = (value) => {
  if (!(isConfigured(value) && emailPattern.test(value))) {
    return false;
  }
  const hostname = value.slice(value.lastIndexOf("@") + 1);
  return !isReservedDeploymentHost(hostname);
};

export const isRemoteHttpsUrl = (value) => {
  const url = parseUrl(value);
  return Boolean(
    url &&
      url.protocol === "https:" &&
      !localHosts.has(url.hostname) &&
      !isReservedDeploymentHost(url.hostname)
  );
};

export const isRemoteHttpsProviderUrl = (value) => {
  const url = parseUrl(value);
  return Boolean(
    isRemoteHttpsUrl(value) && url && !(url.username || url.password)
  );
};

export const hasPrefix = (value, prefix) =>
  isConfigured(value) && value.startsWith(prefix);
