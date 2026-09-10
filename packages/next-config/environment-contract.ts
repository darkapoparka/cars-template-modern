export interface RuntimeEnvironmentContractInput {
  readonly apiUrl?: string;
  readonly appUrl?: string;
  readonly capabilityFlags?: Readonly<Record<string, string | undefined>>;
  readonly docsUrl?: string;
  readonly forbiddenDeploymentFlags?: Readonly<
    Record<string, string | undefined>
  >;
  readonly skipEnvValidation?: string;
  readonly unavailableCapabilityFlags?: readonly string[];
  readonly vercelEnvironment?: string;
  readonly webUrl?: string;
}

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
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
const deploymentEnvironments = new Set(["preview", "production"]);
const vercelEnvironments = new Set(["development", ...deploymentEnvironments]);

export const getClerkDeploymentKeyPrefixes = (
  vercelEnvironment: string | undefined
): { publishable: string; secret: string } => {
  if (vercelEnvironment === "production") {
    return { publishable: "pk_live_", secret: "sk_live_" };
  }
  if (vercelEnvironment === "preview") {
    return { publishable: "pk_test_", secret: "sk_test_" };
  }
  return { publishable: "pk_", secret: "sk_" };
};

const isLoopbackHost = (hostname: string): boolean =>
  loopbackHosts.has(hostname) ||
  ipv4LoopbackPattern.test(hostname) ||
  ipv4MappedLoopbackPattern.test(hostname);

const isNonDeployableHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase();
  return (
    normalized.endsWith(".") ||
    normalized === "0.0.0.0" ||
    normalized === "[::]" ||
    ipv4LiteralPattern.test(normalized) ||
    bracketedIpLiteralPattern.test(normalized) ||
    isLoopbackHost(normalized) ||
    reservedDeploymentHostSuffixes.some(
      (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`)
    )
  );
};

export const isDeployablePublicHostname = (hostname: string): boolean =>
  Boolean(hostname) && !isNonDeployableHost(hostname);

export const isExactRemoteHttpsDeploymentOrigin = (
  value: string | undefined
): boolean => {
  if (!(value && value === value.trim())) {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !(url.username || url.password) &&
      value === url.origin &&
      isDeployablePublicHostname(url.hostname)
    );
  } catch {
    return false;
  }
};

const getExactOrigin = (
  name: string,
  value: string | undefined,
  requireRemoteHttps: boolean,
  issues: string[]
): string | undefined => {
  const normalized = value?.trim();
  if (!normalized) {
    issues.push(`${name} is required`);
    return;
  }
  if (value !== normalized) {
    issues.push(`${name} must not contain surrounding whitespace`);
  }

  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    issues.push(`${name} must be a valid URL origin`);
    return;
  }

  const isHttp = url.protocol === "http:";
  const isHttps = url.protocol === "https:";
  if (!(isHttp || isHttps)) {
    issues.push(`${name} must use HTTP locally or HTTPS when deployed`);
  }
  if (url.username || url.password) {
    issues.push(`${name} must not contain credentials`);
  }
  if (normalized !== url.origin) {
    issues.push(
      `${name} must be an origin without a path, query, hash, or trailing slash`
    );
  }
  if (isHttp && !isLoopbackHost(url.hostname)) {
    issues.push(`${name} may use HTTP only for a loopback host`);
  }
  if (
    requireRemoteHttps &&
    (url.protocol !== "https:" || isNonDeployableHost(url.hostname))
  ) {
    issues.push(`${name} must be a remote HTTPS origin in Vercel deployments`);
  }

  return url.origin;
};

const addDeploymentIssues = (
  capabilityFlags: Readonly<Record<string, string | undefined>>,
  forbiddenDeploymentFlags: Readonly<Record<string, string | undefined>>,
  skipEnvValidation: string | undefined,
  issues: string[]
) => {
  if (skipEnvValidation !== undefined) {
    issues.push("SKIP_ENV_VALIDATION must not exist in Vercel deployments");
  }

  for (const [name, value] of Object.entries(capabilityFlags)) {
    if (!(value === "true" || value === "false")) {
      issues.push(`${name} must be explicitly true or false`);
    }
  }

  for (const [name, value] of Object.entries(forbiddenDeploymentFlags)) {
    if (value !== undefined) {
      issues.push(
        `${name} is test-only and must not be set in Vercel deployments`
      );
    }
  }
};

export const getRuntimeEnvironmentContractIssues = ({
  apiUrl,
  appUrl,
  capabilityFlags = {},
  docsUrl,
  forbiddenDeploymentFlags = {},
  skipEnvValidation,
  unavailableCapabilityFlags = [],
  vercelEnvironment,
  webUrl,
}: RuntimeEnvironmentContractInput): readonly string[] => {
  const issues: string[] = [];
  const isDeployment = deploymentEnvironments.has(
    vercelEnvironment ?? "development"
  );
  if (vercelEnvironment && !vercelEnvironments.has(vercelEnvironment)) {
    issues.push("VERCEL_ENV must be development, preview, or production");
  }
  const origins = [
    getExactOrigin("NEXT_PUBLIC_WEB_URL", webUrl, isDeployment, issues),
    getExactOrigin("NEXT_PUBLIC_APP_URL", appUrl, isDeployment, issues),
    getExactOrigin("NEXT_PUBLIC_API_URL", apiUrl, isDeployment, issues),
  ];

  if (origins.every(Boolean) && new Set(origins).size !== origins.length) {
    issues.push(
      "NEXT_PUBLIC_WEB_URL, NEXT_PUBLIC_APP_URL, and NEXT_PUBLIC_API_URL must be distinct origins"
    );
  }

  if (docsUrl?.trim()) {
    getExactOrigin("NEXT_PUBLIC_DOCS_URL", docsUrl, isDeployment, issues);
  }

  if (isDeployment) {
    addDeploymentIssues(
      capabilityFlags,
      forbiddenDeploymentFlags,
      skipEnvValidation,
      issues
    );
  }

  for (const name of unavailableCapabilityFlags) {
    if (capabilityFlags[name] === "true") {
      issues.push(
        `${name} cannot be enabled until its repository adapter is configured`
      );
    }
  }

  return issues;
};

export const assertRuntimeEnvironmentContract = (
  input: RuntimeEnvironmentContractInput
): void => {
  const issues = getRuntimeEnvironmentContractIssues(input);
  if (issues.length > 0) {
    throw new Error(`Environment contract violation: ${issues.join("; ")}`);
  }
};
