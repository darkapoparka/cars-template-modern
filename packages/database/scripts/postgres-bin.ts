import { existsSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_POSTGRES_BIN_CANDIDATES = [
  "C:\\Program Files\\PostgreSQL\\18\\bin",
  "C:\\Program Files\\PostgreSQL\\17\\bin",
  "C:\\Program Files\\PostgreSQL\\16\\bin",
  "/usr/lib/postgresql/18/bin",
  "/usr/lib/postgresql/17/bin",
  "/usr/local/bin",
  "/usr/bin",
] as const;
const REQUIRED_POSTGRES_TOOLS = [
  "initdb",
  "pg_ctl",
  "postgres",
  "psql",
] as const;

interface PostgresBinResolutionOptions {
  readonly environment?: NodeJS.ProcessEnv;
  readonly fallbackCandidates?: readonly string[];
  readonly fileExists?: (path: string) => boolean;
  readonly platform?: NodeJS.Platform;
}

export const resolvePostgresBin = (
  options: PostgresBinResolutionOptions = {}
) => {
  const environment = options.environment ?? process.env;
  const fileExists = options.fileExists ?? existsSync;
  const platform = options.platform ?? process.platform;
  const executableSuffix = platform === "win32" ? ".exe" : "";
  const requiredExecutables = REQUIRED_POSTGRES_TOOLS.map(
    (tool) => `${tool}${executableSuffix}`
  );
  const missingExecutables = (candidate: string) =>
    requiredExecutables.filter(
      (executable) => !fileExists(join(candidate, executable))
    );
  const legacyOverride = environment.PG_BIN?.trim();
  if (legacyOverride) {
    throw new Error(
      "PG_BIN is not supported; rename it to AUTOMARKET_PG_BIN and unset PG_BIN"
    );
  }

  const canonicalOverride = environment.AUTOMARKET_PG_BIN?.trim();
  if (canonicalOverride) {
    const missing = missingExecutables(canonicalOverride);
    if (missing.length > 0) {
      throw new Error(
        `AUTOMARKET_PG_BIN is missing ${missing.join(", ")}; refusing fallback discovery`
      );
    }
    return canonicalOverride;
  }

  const fallbackCandidates =
    options.fallbackCandidates ?? DEFAULT_POSTGRES_BIN_CANDIDATES;
  const match = fallbackCandidates.find(
    (candidate) => missingExecutables(candidate).length === 0
  );
  if (!match) {
    throw new Error(
      "Local PostgreSQL binaries were not found; set AUTOMARKET_PG_BIN to a PostgreSQL bin directory"
    );
  }
  return match;
};
