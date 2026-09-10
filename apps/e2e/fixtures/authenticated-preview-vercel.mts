import type { APIRequestContext, APIResponse } from "@playwright/test";
import {
  type AuthenticatedPreviewContract,
  type PreviewTarget,
  previewTargetEnvironmentNames,
  previewTargets,
  validateAuthenticatedPreviewEnvironment,
} from "./authenticated-preview-contract.mts";

const vercelApiOrigin = "https://api.vercel.com";
const previewRoutePattern = /^\/(?!\/)/;

const protectionSecret = (
  target: PreviewTarget,
  environment: NodeJS.ProcessEnv
) => {
  const name = previewTargetEnvironmentNames[target].protectionSecret;
  const value = environment[name];
  if (!value) {
    throw new Error(`${target} Vercel protection secret is unavailable`);
  }
  return value;
};

const targetOrigin = (
  contract: AuthenticatedPreviewContract,
  target: PreviewTarget
) => {
  if (target === "api") {
    return contract.apiOrigin;
  }
  if (target === "app") {
    return contract.appOrigin;
  }
  return contract.webOrigin;
};

const exactTargetUrl = (
  contract: AuthenticatedPreviewContract,
  target: PreviewTarget,
  route: string
) => {
  if (!previewRoutePattern.test(route)) {
    throw new Error(`${target} Preview route must be an absolute path`);
  }
  const origin = targetOrigin(contract, target);
  const url = new URL(route, origin);
  if (url.origin !== origin) {
    throw new Error(`${target} Preview route escaped its exact origin`);
  }
  return url;
};

const assertSameOriginRedirect = (
  response: APIResponse,
  requestUrl: URL,
  target: PreviewTarget
) => {
  const status = response.status();
  if (status < 300 || status >= 400) {
    return;
  }
  const location = response.headers().location;
  if (!location) {
    throw new Error(`${target} Vercel bypass returned an invalid redirect`);
  }
  let redirect: URL;
  try {
    redirect = new URL(location, requestUrl);
  } catch {
    throw new Error(`${target} Vercel bypass returned an invalid redirect`);
  }
  if (redirect.origin !== requestUrl.origin) {
    throw new Error(
      `${target} Vercel bypass attempted a cross-origin redirect`
    );
  }
};

export const requestAuthenticatedPreviewTarget = async ({
  establishBypassCookie = false,
  environment = process.env,
  request,
  route,
  target,
}: {
  readonly establishBypassCookie?: boolean;
  readonly environment?: NodeJS.ProcessEnv;
  readonly request: APIRequestContext;
  readonly route: string;
  readonly target: PreviewTarget;
}): Promise<APIResponse> => {
  const contract = validateAuthenticatedPreviewEnvironment(environment);
  const requestUrl = exactTargetUrl(contract, target, route);
  const mode = contract.vercelProtectionModes[target];
  if (mode === "domain-exception") {
    return request.get(requestUrl.href, {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
  }

  const response = await request.get(requestUrl.href, {
    failOnStatusCode: false,
    headers: {
      "x-vercel-protection-bypass": protectionSecret(target, environment),
      ...(establishBypassCookie
        ? { "x-vercel-set-bypass-cookie": "true" }
        : {}),
    },
    maxRedirects: 0,
  });
  assertSameOriginRedirect(response, requestUrl, target);
  if (!establishBypassCookie) {
    return response;
  }

  return request.get(requestUrl.href, {
    failOnStatusCode: false,
    maxRedirects: 0,
  });
};

const objectRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const normalizedAliasOrigin = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }
  try {
    const withProtocol = value.includes("://") ? value : `https://${value}`;
    return new URL(withProtocol).origin;
  } catch {
    return undefined;
  }
};

const assertDeploymentRecord = ({
  contract,
  record,
  target,
}: {
  readonly contract: AuthenticatedPreviewContract;
  readonly record: Record<string, unknown>;
  readonly target: PreviewTarget;
}) => {
  if (record.id !== contract.deploymentIds[target]) {
    throw new Error(`${target} Vercel deployment ID does not match`);
  }

  const project = objectRecord(record.project);
  const projectIds = [record.projectId, project?.id].filter(
    (value): value is string => typeof value === "string"
  );
  if (
    projectIds.length === 0 ||
    projectIds.some((value) => value !== contract.vercelProjectIds[target])
  ) {
    throw new Error(`${target} Vercel project ID does not match`);
  }

  const team = objectRecord(record.team);
  const teamIds = [record.ownerId, record.teamId, team?.id].filter(
    (value): value is string => typeof value === "string"
  );
  if (
    teamIds.length === 0 ||
    teamIds.some((value) => value !== contract.vercelTeamId)
  ) {
    throw new Error(`${target} Vercel team ID does not match`);
  }

  if (record.readyState !== "READY") {
    throw new Error(`${target} Vercel deployment is not READY`);
  }
  if (!(record.target === null || record.target === "preview")) {
    throw new Error(`${target} Vercel deployment is not Preview`);
  }
  if (record.url !== new URL(targetOrigin(contract, target)).hostname) {
    throw new Error(`${target} Vercel immutable hostname does not match`);
  }

  const metadata = objectRecord(record.meta);
  if (metadata?.githubCommitSha !== contract.commitSha) {
    throw new Error(`${target} Vercel commit SHA does not match`);
  }

  const aliases = Array.isArray(record.alias) ? record.alias : [];
  if (
    !aliases.some(
      (alias) => normalizedAliasOrigin(alias) === contract.aliasOrigins[target]
    )
  ) {
    throw new Error(`${target} stable Preview alias is not assigned`);
  }
};

const fetchDeploymentRecord = async ({
  fetchImpl,
  reference,
  target,
  teamId,
  token,
}: {
  readonly fetchImpl: typeof fetch;
  readonly reference: string;
  readonly target: PreviewTarget;
  readonly teamId: string;
  readonly token: string;
}) => {
  const url = new URL(
    `/v13/deployments/${encodeURIComponent(reference)}`,
    vercelApiOrigin
  );
  url.searchParams.set("teamId", teamId);
  let response: Response;
  try {
    response = await fetchImpl(url, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`${target} Vercel deployment lookup failed`);
  }
  if (!response.ok) {
    throw new Error(
      `${target} Vercel deployment lookup returned HTTP ${response.status}`
    );
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new Error(`${target} Vercel deployment lookup returned invalid JSON`);
  }
  const record = objectRecord(parsed);
  if (!record) {
    throw new Error(`${target} Vercel deployment lookup returned invalid data`);
  }
  return record;
};

export const verifyAuthenticatedPreviewCandidate = async ({
  environment = process.env,
  fetchImpl = fetch,
}: {
  readonly environment?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
} = {}) => {
  const contract = validateAuthenticatedPreviewEnvironment(environment);
  const token = environment.E2E_VERCEL_TOKEN;
  if (!token) {
    throw new Error("Vercel candidate verification token is unavailable");
  }

  for (const target of previewTargets) {
    const references = [
      contract.deploymentIds[target],
      new URL(targetOrigin(contract, target)).hostname,
      new URL(contract.aliasOrigins[target]).hostname,
    ];
    for (const reference of references) {
      const record = await fetchDeploymentRecord({
        fetchImpl,
        reference,
        target,
        teamId: contract.vercelTeamId,
        token,
      });
      assertDeploymentRecord({ contract, record, target });
    }
  }
};
