import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const studioHost = "127.0.0.1";
const deployedVercelEnvironments = new Set(["preview", "production"]);
const prismaCli = fileURLToPath(
  new URL("./node_modules/prisma/build/index.js", import.meta.url)
);

const getDatabaseTarget = (environment) => {
  const rawUrl = environment.DATABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error("DATABASE_URL is required. Prisma Studio was not started.");
  }

  let databaseUrl;
  try {
    databaseUrl = new URL(rawUrl);
  } catch {
    throw new Error("DATABASE_URL is invalid. Prisma Studio was not started.");
  }

  if (
    !(
      databaseUrl.protocol === "postgres:" ||
      databaseUrl.protocol === "postgresql:"
    )
  ) {
    throw new Error(
      "DATABASE_URL must use PostgreSQL. Prisma Studio was not started."
    );
  }

  return databaseUrl;
};

const getDatabaseIdentity = (databaseUrl) => {
  let databasePath;
  try {
    databasePath = decodeURIComponent(databaseUrl.pathname);
  } catch {
    throw new Error("DATABASE_URL is invalid. Prisma Studio was not started.");
  }
  if (databasePath.length <= 1) {
    throw new Error(
      "DATABASE_URL must select a database. Prisma Studio was not started."
    );
  }
  const host = databaseUrl.hostname.toLowerCase();
  return `${host}:${databaseUrl.port || "5432"}${databasePath}`;
};

export const assertStudioSafety = (environment = process.env) => {
  if (
    environment.NODE_ENV === "production" ||
    deployedVercelEnvironments.has(environment.VERCEL_ENV)
  ) {
    throw new Error(
      "Prisma Studio is disabled in Vercel deployments and production runtime environments."
    );
  }

  const databaseUrl = getDatabaseTarget(environment);
  const databaseHost = databaseUrl.hostname.toLowerCase();
  const databaseIdentity = getDatabaseIdentity(databaseUrl);
  const isLoopbackDatabase = loopbackHosts.has(databaseHost);

  if (!isLoopbackDatabase) {
    const allowedIdentity =
      environment.AUTOMARKET_STUDIO_ALLOWED_DATABASE_IDENTITY?.trim();
    const confirmed =
      environment.AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION === "true";

    if (!(confirmed && allowedIdentity === databaseIdentity)) {
      throw new Error(
        "Remote database access requires AUTOMARKET_STUDIO_ALLOWED_DATABASE_IDENTITY to exactly match DATABASE_URL as host:port/database and AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION=true."
      );
    }
  }

  return {
    databaseHost,
    databaseIdentity,
    isLoopbackDatabase,
    studioHost,
  };
};

export const createStudioProcess = (environment = process.env) => {
  return {
    args: [
      prismaCli,
      "studio",
      "--config",
      "../../packages/database/prisma.config.ts",
      "--port",
      "3005",
      "--browser",
      "none",
    ],
    command: process.execPath,
    env: {
      ...environment,
      BROWSER: "none",
      HOST: studioHost,
    },
  };
};

export const runStudio = (environment = process.env) => {
  const target = assertStudioSafety(environment);
  const childProcess = createStudioProcess(environment);

  console.log(
    `Starting Prisma Studio on http://${studioHost}:3005 for database host ${target.databaseHost}.`
  );

  const child = spawn(childProcess.command, childProcess.args, {
    env: childProcess.env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error("Failed to start Prisma Studio.", error);
    process.exitCode = 1;
  });

  child.on("close", (exitCode, signal) => {
    if (signal) {
      console.error(`Prisma Studio stopped by ${signal}.`);
      process.exitCode = 1;
      return;
    }
    process.exitCode = exitCode ?? 1;
  });
};

const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  try {
    runStudio();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
