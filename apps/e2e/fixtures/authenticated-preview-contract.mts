import { randomUUID } from "node:crypto";
import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";

export const previewPersonas = [
  "buyer",
  "seller",
  "dealer",
  "admin",
  "operator",
] as const;

export const previewTargets = ["web", "app", "api"] as const;

export const authenticatedPreviewFixtureVersion = "authenticated-preview-v2";

export type PreviewPersona = (typeof previewPersonas)[number];
export type PreviewTarget = (typeof previewTargets)[number];
export type VercelProtectionMode = "automation-bypass" | "domain-exception";

export const previewTargetEnvironmentNames = {
  api: {
    alias: "E2E_API_ALIAS_URL",
    deploymentId: "E2E_API_DEPLOYMENT_ID",
    origin: "E2E_API_URL",
    projectId: "E2E_API_VERCEL_PROJECT_ID",
    protectionExceptionOrigin: "E2E_API_VERCEL_PROTECTION_EXCEPTION_ORIGIN",
    protectionMode: "E2E_API_VERCEL_PROTECTION_MODE",
    protectionSecret: "E2E_API_VERCEL_AUTOMATION_BYPASS_SECRET",
  },
  app: {
    alias: "E2E_APP_ALIAS_URL",
    deploymentId: "E2E_APP_DEPLOYMENT_ID",
    origin: "E2E_APP_URL",
    projectId: "E2E_APP_VERCEL_PROJECT_ID",
    protectionExceptionOrigin: "E2E_APP_VERCEL_PROTECTION_EXCEPTION_ORIGIN",
    protectionMode: "E2E_APP_VERCEL_PROTECTION_MODE",
    protectionSecret: "E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET",
  },
  web: {
    alias: "E2E_WEB_ALIAS_URL",
    deploymentId: "E2E_WEB_DEPLOYMENT_ID",
    origin: "E2E_WEB_URL",
    projectId: "E2E_WEB_VERCEL_PROJECT_ID",
    protectionExceptionOrigin: "E2E_WEB_VERCEL_PROTECTION_EXCEPTION_ORIGIN",
    protectionMode: "E2E_WEB_VERCEL_PROTECTION_MODE",
    protectionSecret: "E2E_WEB_VERCEL_AUTOMATION_BYPASS_SECRET",
  },
} as const satisfies Readonly<
  Record<
    PreviewTarget,
    Readonly<{
      alias: string;
      deploymentId: string;
      origin: string;
      projectId: string;
      protectionExceptionOrigin: string;
      protectionMode: string;
      protectionSecret: string;
    }>
  >
>;

export interface PlaywrightStorageState {
  readonly cookies: readonly {
    readonly domain: string;
    readonly expires: number;
    readonly httpOnly: boolean;
    readonly name: string;
    readonly path: string;
    readonly sameSite: "Lax" | "None" | "Strict";
    readonly secure: boolean;
    readonly value: string;
  }[];
  readonly origins: readonly {
    readonly localStorage: readonly {
      readonly name: string;
      readonly value: string;
    }[];
    readonly origin: string;
  }[];
}

export interface AuthenticatedPreviewContract {
  readonly aliasOrigins: Readonly<Record<PreviewTarget, string>>;
  readonly apiOrigin: string;
  readonly appOrigin: string;
  readonly candidateId: string;
  readonly clerkIssuer: string;
  readonly commitSha: string;
  readonly databaseEndpointId: string;
  readonly databaseMarker: string;
  readonly deploymentIds: Readonly<Record<PreviewTarget, string>>;
  readonly fixtureVersion: string;
  readonly personaEmails: Readonly<Record<PreviewPersona, string>>;
  readonly personaUserIds: Readonly<Record<PreviewPersona, string>>;
  readonly vercelProjectIds: Readonly<Record<PreviewTarget, string>>;
  readonly vercelProtectionModes: Readonly<
    Record<PreviewTarget, VercelProtectionMode>
  >;
  readonly vercelTeamId: string;
  readonly webOrigin: string;
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/;
const markerPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{2,47}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const commitPattern = /^[a-f\d]{40}$/;
const base64Pattern = /^[A-Za-z\d+/]+={0,2}$/;
const databaseEndpointPattern = /^ep-[a-z\d-]{4,}$/;
const deploymentIdPattern = /^dpl_[A-Za-z\d]{8,}$/;
const projectIdPattern = /^prj_[A-Za-z\d]{8,}$/;
const teamIdPattern = /^team_[A-Za-z\d]{8,}$/;
const organizationIdPattern = /^org_[A-Za-z\d_-]+$/;
const sessionIdPattern = /^sess_[A-Za-z\d_-]+$/;
const sessionCookiePattern = /^__session_[A-Za-z0-9]{8}$/;
const userIdPattern = /^user_[A-Za-z\d_-]+$/;
const whitespacePattern = /\s/g;
const secretWhitespacePattern = /\s/;
const stateEnvironmentNames = Object.fromEntries(
  previewPersonas.map((persona) => [
    persona,
    `E2E_${persona.toUpperCase()}_STORAGE_STATE`,
  ])
) as Record<PreviewPersona, string>;

const requiredValue = (
  environment: NodeJS.ProcessEnv,
  name: string,
  pattern?: RegExp
): string => {
  const value = environment[name]?.trim();
  if (!(value && (!pattern || pattern.test(value)))) {
    throw new Error(`${name} is missing or invalid`);
  }
  return value;
};

const requiredSecret = (
  environment: NodeJS.ProcessEnv,
  name: string
): string => {
  const value = environment[name];
  if (!(value && value.length >= 16 && !secretWhitespacePattern.test(value))) {
    throw new Error(`${name} is missing or invalid`);
  }
  return value;
};

const requireRemoteHttpsOrigin = (
  environment: NodeJS.ProcessEnv,
  name: string
): string => {
  const value = requiredValue(environment, name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an exact remote HTTPS origin`);
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    localHosts.has(url.hostname) ||
    url.hostname.includes("*") ||
    !url.hostname.includes(".") ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must be an exact remote HTTPS origin`);
  }

  return url.origin;
};

const requirePreviewDeploymentOrigin = (
  environment: NodeJS.ProcessEnv,
  name: string
): string => {
  const value = requiredValue(environment, name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an immutable Preview HTTPS origin`);
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    localHosts.has(url.hostname) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !url.hostname.endsWith(".vercel.app")
  ) {
    throw new Error(`${name} must be an immutable Vercel Preview HTTPS origin`);
  }

  return url.origin;
};

const requireClerkIssuer = (environment: NodeJS.ProcessEnv): string => {
  const value = requiredValue(environment, "E2E_CLERK_ISSUER");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("E2E_CLERK_ISSUER must be a Clerk Preview HTTPS origin");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !url.hostname.endsWith(".clerk.accounts.dev")
  ) {
    throw new Error("E2E_CLERK_ISSUER must be a Clerk Preview HTTPS origin");
  }

  return url.origin;
};

const distinctValues = (values: readonly string[], message: string) => {
  if (new Set(values).size !== values.length) {
    throw new Error(message);
  }
};

const requireVercelProtectionModes = (
  environment: NodeJS.ProcessEnv,
  origins: Readonly<Record<PreviewTarget, string>>
) => {
  const modes = {} as Record<PreviewTarget, VercelProtectionMode>;
  const automationSecrets: string[] = [];
  for (const target of previewTargets) {
    const names = previewTargetEnvironmentNames[target];
    const mode = requiredValue(environment, names.protectionMode);
    if (!(mode === "automation-bypass" || mode === "domain-exception")) {
      throw new Error(
        `${names.protectionMode} must be automation-bypass or domain-exception`
      );
    }
    modes[target] = mode;

    if (mode === "automation-bypass") {
      automationSecrets.push(
        requiredSecret(environment, names.protectionSecret)
      );
      if (environment[names.protectionExceptionOrigin]?.trim()) {
        throw new Error(
          `${names.protectionExceptionOrigin} must be empty in automation-bypass mode`
        );
      }
      continue;
    }

    if (environment[names.protectionSecret]?.trim()) {
      throw new Error(
        `${names.protectionSecret} must be empty in domain-exception mode`
      );
    }
    const exceptionOrigin = requireRemoteHttpsOrigin(
      environment,
      names.protectionExceptionOrigin
    );
    if (exceptionOrigin !== origins[target]) {
      throw new Error(
        `${names.protectionExceptionOrigin} must exactly match ${names.origin}`
      );
    }
  }
  distinctValues(
    automationSecrets,
    "Every Vercel automation-bypass project must use a distinct secret"
  );
  return modes;
};

const requireCandidateVerificationAccess = (environment: NodeJS.ProcessEnv) => {
  if (environment.E2E_CANDIDATE_INTEGRITY_VERIFIED !== "true") {
    requiredSecret(environment, "E2E_VERCEL_TOKEN");
    return;
  }
  if (environment.E2E_PROTECTED_RELEASE !== "true") {
    throw new Error(
      "Candidate integrity attestation is valid only inside the protected runner"
    );
  }
};

const requireVercelCandidateContract = (environment: NodeJS.ProcessEnv) => {
  const origins = {
    api: requirePreviewDeploymentOrigin(environment, "E2E_API_URL"),
    app: requirePreviewDeploymentOrigin(environment, "E2E_APP_URL"),
    web: requirePreviewDeploymentOrigin(environment, "E2E_WEB_URL"),
  } satisfies Record<PreviewTarget, string>;
  distinctValues(
    Object.values(origins),
    "Preview web, app, and API deployment origins must be distinct"
  );

  const aliasOrigins = Object.fromEntries(
    previewTargets.map((target) => [
      target,
      requireRemoteHttpsOrigin(
        environment,
        previewTargetEnvironmentNames[target].alias
      ),
    ])
  ) as Record<PreviewTarget, string>;
  distinctValues(
    [...Object.values(origins), ...Object.values(aliasOrigins)],
    "Preview immutable deployment and stable alias origins must all be distinct"
  );

  const deploymentIds = Object.fromEntries(
    previewTargets.map((target) => [
      target,
      requiredValue(
        environment,
        previewTargetEnvironmentNames[target].deploymentId,
        deploymentIdPattern
      ),
    ])
  ) as Record<PreviewTarget, string>;
  distinctValues(
    Object.values(deploymentIds),
    "Preview deployment IDs must be distinct"
  );

  const vercelProjectIds = Object.fromEntries(
    previewTargets.map((target) => [
      target,
      requiredValue(
        environment,
        previewTargetEnvironmentNames[target].projectId,
        projectIdPattern
      ),
    ])
  ) as Record<PreviewTarget, string>;
  distinctValues(
    Object.values(vercelProjectIds),
    "Preview Vercel project IDs must be distinct"
  );
  const vercelTeamId = requiredValue(
    environment,
    "E2E_VERCEL_TEAM_ID",
    teamIdPattern
  );
  requireCandidateVerificationAccess(environment);

  return {
    aliasOrigins,
    deploymentIds,
    origins,
    vercelProjectIds,
    vercelProtectionModes: requireVercelProtectionModes(environment, origins),
    vercelTeamId,
  };
};

const requireClerkContract = (
  environment: NodeJS.ProcessEnv,
  appOrigin: string
) => {
  if (
    !requiredValue(environment, "CLERK_PUBLISHABLE_KEY").startsWith("pk_test_")
  ) {
    throw new Error(
      "CLERK_PUBLISHABLE_KEY must belong to a Clerk Preview instance"
    );
  }
  if (!requiredValue(environment, "CLERK_SECRET_KEY").startsWith("sk_test_")) {
    throw new Error("CLERK_SECRET_KEY must belong to a Clerk Preview instance");
  }
  if (
    requireRemoteHttpsOrigin(environment, "E2E_CLERK_TRUSTED_APP_ORIGIN") !==
    appOrigin
  ) {
    throw new Error(
      "E2E_CLERK_TRUSTED_APP_ORIGIN must exactly match E2E_APP_URL"
    );
  }
  return requireClerkIssuer(environment);
};

const requirePersonaContract = (environment: NodeJS.ProcessEnv) => {
  const personaEmails = Object.fromEntries(
    previewPersonas.map((persona) => {
      const name = `E2E_${persona.toUpperCase()}_EMAIL`;
      return [persona, requiredValue(environment, name, emailPattern)];
    })
  ) as unknown as Record<PreviewPersona, string>;
  const personaUserIds = Object.fromEntries(
    previewPersonas.map((persona) => {
      const name = `E2E_${persona.toUpperCase()}_USER_ID`;
      return [persona, requiredValue(environment, name, userIdPattern)];
    })
  ) as unknown as Record<PreviewPersona, string>;
  distinctValues(
    Object.values(personaEmails),
    "Every Preview persona must use a distinct email address"
  );
  distinctValues(
    Object.values(personaUserIds),
    "Every Preview persona must use a distinct Clerk user ID"
  );

  requiredValue(environment, "E2E_DEALER_ORG_ID", organizationIdPattern);
  const dealerRole = requiredValue(environment, "E2E_DEALER_ORG_ROLE");
  if (!(dealerRole === "org:owner" || dealerRole === "org:admin")) {
    throw new Error("E2E_DEALER_ORG_ROLE must be org:owner or org:admin");
  }
  return { personaEmails, personaUserIds };
};

export const validateAuthenticatedPreviewEnvironment = (
  environment: NodeJS.ProcessEnv = process.env
): AuthenticatedPreviewContract => {
  if (environment.E2E_ENVIRONMENT !== "preview") {
    throw new Error("E2E_ENVIRONMENT must be exactly preview");
  }

  const candidate = requireVercelCandidateContract(environment);
  const { api: apiOrigin, app: appOrigin, web: webOrigin } = candidate.origins;

  const candidateId = requiredValue(
    environment,
    "E2E_CANDIDATE_ID",
    identifierPattern
  );
  const commitSha = requiredValue(environment, "E2E_COMMIT_SHA", commitPattern);
  requiredValue(environment, "E2E_DATABASE_BRANCH_ID", identifierPattern);
  const databaseEndpointId = requiredValue(
    environment,
    "E2E_DATABASE_ENDPOINT_ID",
    databaseEndpointPattern
  );
  const databaseMarker = requiredValue(
    environment,
    "E2E_DATABASE_MARKER",
    markerPattern
  );
  const fixtureVersion = requiredValue(
    environment,
    "E2E_FIXTURE_VERSION",
    markerPattern
  );
  if (fixtureVersion !== authenticatedPreviewFixtureVersion) {
    throw new Error(
      `E2E_FIXTURE_VERSION must be exactly ${authenticatedPreviewFixtureVersion}`
    );
  }

  const clerkIssuer = requireClerkContract(environment, appOrigin);
  const { personaEmails, personaUserIds } = requirePersonaContract(environment);

  return {
    aliasOrigins: candidate.aliasOrigins,
    appOrigin,
    apiOrigin,
    candidateId,
    clerkIssuer,
    commitSha,
    databaseEndpointId,
    databaseMarker,
    deploymentIds: candidate.deploymentIds,
    fixtureVersion,
    personaEmails,
    personaUserIds,
    vercelProjectIds: candidate.vercelProjectIds,
    vercelProtectionModes: candidate.vercelProtectionModes,
    vercelTeamId: candidate.vercelTeamId,
    webOrigin,
  };
};

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    throw new Error("Persona session cookie is not a JWT");
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid payload");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Persona session cookie has an invalid JWT payload");
  }
};

const normalizeOrigin = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const hostnameMatchesCookieDomain = (hostname: string, domain: string) => {
  const normalized = domain.startsWith(".") ? domain.slice(1) : domain;
  return hostname === normalized;
};

const getOrganizationClaims = (claims: Record<string, unknown>) => {
  const compact =
    claims.o && typeof claims.o === "object" && !Array.isArray(claims.o)
      ? (claims.o as Record<string, unknown>)
      : undefined;
  let id: string | undefined;
  if (typeof claims.org_id === "string") {
    id = claims.org_id;
  } else if (typeof compact?.id === "string") {
    id = compact.id;
  }
  let rawRole: string | undefined;
  if (typeof claims.org_role === "string") {
    rawRole = claims.org_role;
  } else if (typeof compact?.rol === "string") {
    rawRole = compact.rol;
  }
  let role: string | undefined;
  if (rawRole) {
    role = rawRole.startsWith("org:") ? rawRole : `org:${rawRole}`;
  }
  return { id, role };
};

const getMetadataRole = (claims: Record<string, unknown>) => {
  const metadata =
    claims.metadata &&
    typeof claims.metadata === "object" &&
    !Array.isArray(claims.metadata)
      ? (claims.metadata as Record<string, unknown>)
      : undefined;
  return typeof metadata?.role === "string" ? metadata.role : undefined;
};

const assertPersonaClaims = (
  claims: Record<string, unknown>,
  persona: PreviewPersona,
  environment: NodeJS.ProcessEnv
) => {
  const expectedUserId = requiredValue(
    environment,
    `E2E_${persona.toUpperCase()}_USER_ID`
  );
  if (claims.sub !== expectedUserId) {
    throw new Error(`${persona} state belongs to the wrong Clerk user`);
  }

  const metadataRole = getMetadataRole(claims);
  const organization = getOrganizationClaims(claims);
  if (persona === "admin") {
    if (metadataRole !== "admin" || organization.id || organization.role) {
      throw new Error("admin state has incorrect role or organization claims");
    }
    return;
  }
  if (persona === "operator") {
    if (metadataRole !== "support" || organization.id || organization.role) {
      throw new Error(
        "operator state has incorrect role or organization claims"
      );
    }
    return;
  }
  if (persona === "dealer") {
    if (
      metadataRole ||
      organization.id !== requiredValue(environment, "E2E_DEALER_ORG_ID") ||
      organization.role !== requiredValue(environment, "E2E_DEALER_ORG_ROLE")
    ) {
      throw new Error("dealer state has incorrect role or organization claims");
    }
    return;
  }
  if (metadataRole || organization.id || organization.role) {
    throw new Error(
      `${persona} state must use a personal, unprivileged session`
    );
  }
};

const storageStateArrays = (state: unknown, persona: PreviewPersona) => {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error(`${persona} state must be a Playwright storage state`);
  }
  const candidate = state as Record<string, unknown>;
  if (!(Array.isArray(candidate.cookies) && Array.isArray(candidate.origins))) {
    throw new Error(`${persona} state must contain cookies and origins arrays`);
  }
  return { cookies: candidate.cookies, origins: candidate.origins };
};

const validatedCookie = (rawCookie: unknown, persona: PreviewPersona) => {
  if (!rawCookie || typeof rawCookie !== "object" || Array.isArray(rawCookie)) {
    throw new Error(`${persona} state contains an invalid cookie`);
  }
  const cookie = rawCookie as Record<string, unknown>;
  const validIdentity =
    typeof cookie.name === "string" &&
    Boolean(cookie.name) &&
    typeof cookie.value === "string" &&
    Boolean(cookie.value) &&
    typeof cookie.domain === "string" &&
    Boolean(cookie.domain);
  const validPath =
    typeof cookie.path === "string" && cookie.path.startsWith("/");
  const validFlags =
    typeof cookie.expires === "number" &&
    typeof cookie.httpOnly === "boolean" &&
    typeof cookie.secure === "boolean" &&
    ["Lax", "None", "Strict"].includes(String(cookie.sameSite));
  if (!(validIdentity && validPath && validFlags)) {
    throw new Error(`${persona} state contains a malformed cookie`);
  }
  return cookie;
};

const validateCookies = (
  cookies: unknown[],
  persona: PreviewPersona,
  allowedHosts: string[],
  nowSeconds: number
) => {
  const cookieKeys = new Set<string>();
  for (const rawCookie of cookies) {
    const cookie = validatedCookie(rawCookie, persona);
    if (!cookie.secure) {
      throw new Error(`${persona} state contains a non-secure cookie`);
    }
    const cookieDomain = cookie.domain as string;
    if (
      !allowedHosts.some((hostname) =>
        hostnameMatchesCookieDomain(hostname, cookieDomain)
      )
    ) {
      throw new Error(
        `${persona} state contains a cookie for the wrong origin`
      );
    }
    if (
      (cookie.expires as number) > 0 &&
      (cookie.expires as number) <= nowSeconds
    ) {
      throw new Error(`${persona} state contains an expired cookie`);
    }
    const key = `${cookie.domain}\n${cookie.path}\n${cookie.name}`;
    if (cookieKeys.has(key)) {
      throw new Error(`${persona} state contains duplicate cookies`);
    }
    cookieKeys.add(key);
  }
};

const validateLocalStorage = (items: unknown[], persona: PreviewPersona) => {
  const localKeys = new Set<string>();
  for (const item of items) {
    const record = item as Record<string, unknown> | null;
    if (
      !record ||
      Array.isArray(record) ||
      typeof record.name !== "string" ||
      typeof record.value !== "string"
    ) {
      throw new Error(`${persona} state contains invalid local storage`);
    }
    if (localKeys.has(record.name)) {
      throw new Error(`${persona} state contains duplicate local storage`);
    }
    localKeys.add(record.name);
  }
};

const validateOrigins = (
  origins: unknown[],
  persona: PreviewPersona,
  allowedOrigins: Set<string>
) => {
  const stateOrigins = new Set<string>();
  for (const rawOrigin of origins) {
    const origin = rawOrigin as Record<string, unknown> | null;
    if (!origin || Array.isArray(origin)) {
      throw new Error(`${persona} state contains an invalid origin entry`);
    }
    const normalized = normalizeOrigin(origin.origin);
    if (
      !(
        normalized &&
        normalized === origin.origin &&
        allowedOrigins.has(normalized)
      )
    ) {
      throw new Error(`${persona} state contains storage for the wrong origin`);
    }
    if (stateOrigins.has(normalized) || !Array.isArray(origin.localStorage)) {
      throw new Error(`${persona} state contains duplicate or invalid origins`);
    }
    stateOrigins.add(normalized);
    validateLocalStorage(origin.localStorage, persona);
  }
};

const getSessionCookie = (
  cookies: unknown[],
  persona: PreviewPersona,
  appOrigin: string
) => {
  const appHostname = new URL(appOrigin).hostname;
  const sessionCookies = cookies.filter((rawCookie) => {
    const cookie = rawCookie as Record<string, unknown>;
    const validName =
      cookie.name === "__session" ||
      (typeof cookie.name === "string" &&
        sessionCookiePattern.test(cookie.name));
    return (
      validName &&
      typeof cookie.domain === "string" &&
      hostnameMatchesCookieDomain(appHostname, cookie.domain)
    );
  }) as Record<string, unknown>[];
  if (
    sessionCookies.length !== 1 ||
    typeof sessionCookies[0]?.value !== "string"
  ) {
    throw new Error(
      `${persona} state must contain exactly one app session cookie`
    );
  }
  return sessionCookies[0].value;
};

const validateSessionClaims = ({
  appOrigin,
  clerkIssuer,
  environment,
  nowSeconds,
  persona,
  value,
}: {
  appOrigin: string;
  clerkIssuer: string;
  environment: NodeJS.ProcessEnv;
  nowSeconds: number;
  persona: PreviewPersona;
  value: string;
}) => {
  const claims = decodeJwtPayload(value);
  if (claims.iss !== clerkIssuer) {
    throw new Error(`${persona} state belongs to the wrong Clerk environment`);
  }
  if (claims.azp !== appOrigin) {
    throw new Error(`${persona} state was captured for the wrong app origin`);
  }
  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds + 5) {
    throw new Error(`${persona} state has an expired session token`);
  }
  if (
    typeof claims.iat !== "number" ||
    claims.iat < nowSeconds - 300 ||
    claims.iat > nowSeconds + 60
  ) {
    throw new Error(`${persona} state has invalid session timing claims`);
  }
  if (typeof claims.sid !== "string" || !sessionIdPattern.test(claims.sid)) {
    throw new Error(`${persona} state has an invalid Clerk session ID`);
  }
  assertPersonaClaims(claims, persona, environment);
};

export const validateStorageState = (
  state: unknown,
  persona: PreviewPersona,
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
): PlaywrightStorageState => {
  const candidate = storageStateArrays(state, persona);
  const appOrigin = new URL(requiredValue(environment, "E2E_APP_URL")).origin;
  const clerkIssuer = requireClerkIssuer(environment);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  validateCookies(
    candidate.cookies,
    persona,
    [new URL(appOrigin).hostname, new URL(clerkIssuer).hostname],
    nowSeconds
  );
  validateOrigins(
    candidate.origins,
    persona,
    new Set([appOrigin, clerkIssuer])
  );
  validateSessionClaims({
    appOrigin,
    clerkIssuer,
    environment,
    nowSeconds,
    persona,
    value: getSessionCookie(candidate.cookies, persona, appOrigin),
  });

  return state as PlaywrightStorageState;
};

export const decodeStorageState = (
  encoded: string | undefined,
  variableName: string
): unknown => {
  const normalized = encoded?.replaceAll(whitespacePattern, "") ?? "";
  if (!(normalized && base64Pattern.test(normalized))) {
    throw new Error(`${variableName} must contain valid base64`);
  }
  try {
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
  } catch {
    throw new Error(`${variableName} must decode to valid JSON`);
  }
};

const applyProtectedMode = async (path: string, mode: number) => {
  try {
    await chmod(path, mode);
  } catch (error) {
    if (process.platform !== "win32") {
      throw error;
    }
  }
};

export const writeProtectedStorageState = async (
  outputDirectory: string,
  persona: PreviewPersona,
  state: unknown,
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
): Promise<string> => {
  const validated = validateStorageState(state, persona, environment, now);
  const directory = resolve(outputDirectory);
  const target = resolve(directory, `${persona}.json`);
  const temporary = resolve(
    directory,
    `.${persona}.${process.pid}.${randomUUID()}.tmp`
  );
  await mkdir(directory, { mode: 0o700, recursive: true });
  await applyProtectedMode(directory, 0o700);
  try {
    await writeFile(temporary, JSON.stringify(validated), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await applyProtectedMode(temporary, 0o600);
    await rename(temporary, target);
    await applyProtectedMode(target, 0o600);
    return target;
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
};

export const readAndValidateStorageState = async (
  path: string,
  persona: PreviewPersona,
  environment: NodeJS.ProcessEnv = process.env,
  now = new Date()
) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw new Error(`${persona} storage-state file is missing or invalid`);
  }
  return validateStorageState(parsed, persona, environment, now);
};

export const storageStateEnvironmentName = (persona: PreviewPersona) =>
  stateEnvironmentNames[persona];
