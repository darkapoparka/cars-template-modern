import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  rmSync,
  statfsSync,
  writeFileSync,
} from "node:fs";
import { rm } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";

const forwardedArguments = process.argv.slice(2);
const repositoryRoot = resolve(import.meta.dirname, "../..");
const publicWebRoot = resolve(import.meta.dirname, "../web");
const publicNextCli = resolve(publicWebRoot, "node_modules/next/dist/bin/next");
const publicPlaywrightCli = resolve(
  import.meta.dirname,
  "node_modules/@playwright/test/cli.js"
);
const publicServerRunner = resolve(
  import.meta.dirname,
  "run-public-web-server.mjs"
);
const publicNextEnvPath = resolve(import.meta.dirname, "../web/next-env.d.ts");
const minimumFreeBytes = 2n * 1024n * 1024n * 1024n;
const runId = `${process.pid}-${Date.now().toString(36)}`;
const publicE2ENextEnvImport =
  /import "\.\/\.next-public-e2e-[^"]+\/(?:dev\/)?types\/routes\.d\.ts";/;
const initialNextEnv = existsSync(publicNextEnvPath)
  ? readFileSync(publicNextEnvPath, "utf8").replace(
      publicE2ENextEnvImport,
      'import "./.next/types/routes.d.ts";'
    )
  : undefined;
let activeChild;
let activeServer;
let shuttingDown = false;

const getPublicE2EDistDirectory = (mode) =>
  resolve(import.meta.dirname, `../web/.next-public-e2e-${runId}-${mode}`);

const cleanPublicE2EDist = async (mode) => {
  const directory = getPublicE2EDistDirectory(mode);

  for (let attempt = 0; attempt <= 20; attempt += 1) {
    try {
      await rm(directory, { force: true, recursive: true });
      return;
    } catch (error) {
      const retryable =
        error?.code === "EBUSY" ||
        error?.code === "ENOTEMPTY" ||
        error?.code === "EPERM";
      if (!(retryable && attempt < 20)) {
        throw error;
      }
      await delay(500);
    }
  }
};

const restorePublicNextEnv = () => {
  if (initialNextEnv === undefined) {
    rmSync(publicNextEnvPath, { force: true });
    return;
  }

  writeFileSync(publicNextEnvPath, initialNextEnv);
};

const stopProcessTree = (child) => {
  if (!child?.pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
};

const stopPublicServerImmediately = () => {
  stopProcessTree(activeServer);
  activeServer = undefined;
};

const shutdown = (exitCode) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopProcessTree(activeChild);
  stopPublicServerImmediately();
  restorePublicNextEnv();
  process.exit(exitCode);
};

process.once("SIGINT", () => shutdown(130));
process.once("SIGTERM", () => shutdown(143));

const getAvailablePort = () =>
  new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to reserve a public E2E port."));
        return;
      }

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolvePort(address.port);
      });
    });
  });

const delay = (duration) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, duration));

const getPublicEnvironment = (mode, port) => ({
  ...process.env,
  ARCJET_KEY: "",
  AUTOMARKET_PUBLIC_E2E: "true",
  BASEHUB_TOKEN: "",
  BETTERSTACK_API_KEY: "",
  BETTERSTACK_URL: "",
  DATABASE_URL: "",
  E2E_PUBLIC_MODE: mode,
  E2E_PUBLIC_PORT: String(port),
  E2E_PUBLIC_RUN_ID: runId,
  FLAGS_SECRET: "",
  LOGTAIL_SOURCE_TOKEN: "",
  LOGTAIL_URL: "",
  NEXT_PUBLIC_API_URL: "http://127.0.0.1:3002",
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100",
  NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E: "true",
  NEXT_PUBLIC_BETTER_STACK_CUSTOM_ENDPOINT: "",
  NEXT_PUBLIC_BETTER_STACK_INGESTING_URL: "",
  NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: "",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
  NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN: "",
  NEXT_PUBLIC_LOGTAIL_URL: "",
  NEXT_PUBLIC_POSTHOG_HOST: "",
  NEXT_PUBLIC_POSTHOG_KEY: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
  NEXT_PUBLIC_WEB_URL: `http://127.0.0.1:${port}`,
  RESEND_FROM: "",
  RESEND_TOKEN: "",
  SKIP_ENV_VALIDATION: "true",
  UPSTASH_REDIS_REST_TOKEN: "",
  UPSTASH_REDIS_REST_URL: "",
});

const runPublicBuild = (mode, port) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [publicNextCli, "build"], {
      cwd: publicWebRoot,
      detached: process.platform !== "win32",
      env: getPublicEnvironment(mode, port),
      stdio: "inherit",
      windowsHide: true,
    });
    activeChild = child;

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (activeChild === child) {
        activeChild = undefined;
      }
      if (signal) {
        reject(new Error(`Public Next.js build stopped by ${signal}.`));
        return;
      }
      resolveRun(code ?? 1);
    });
  });

const startPublicServer = (mode, port) => {
  const nextCommand = mode === "unavailable" ? "start" : "dev";
  const state = {
    error: undefined,
    exited: false,
    signal: undefined,
    code: undefined,
  };
  const child = spawn(process.execPath, [publicServerRunner, nextCommand], {
    cwd: publicWebRoot,
    detached: process.platform !== "win32",
    env: getPublicEnvironment(mode, port),
    stdio: ["ignore", "inherit", "inherit", "ipc"],
    windowsHide: true,
  });
  activeServer = child;

  child.once("error", (error) => {
    state.error = error;
  });
  child.once("exit", (code, signal) => {
    state.code = code;
    state.exited = true;
    state.signal = signal;
  });

  return state;
};

const waitForPublicServer = async (state, mode, port) => {
  const timeout = mode === "unavailable" ? 240_000 : 300_000;
  const deadline = Date.now() + timeout;
  const url = `http://127.0.0.1:${port}`;

  while (Date.now() < deadline) {
    if (state.error) {
      throw state.error;
    }
    if (state.exited) {
      throw new Error(
        `Public Next.js server exited before it was ready (${state.signal ?? state.code ?? "unknown"}).`
      );
    }

    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(2000),
      });
      if (response.status < 500) {
        return;
      }
    } catch {
      // The server is still starting. Retry until the bounded deadline.
    }

    await delay(250);
  }

  throw new Error(
    `Public Next.js ${mode} server did not become ready within ${timeout / 1000} seconds.`
  );
};

const stopPublicServer = async (port) => {
  const server = activeServer;

  if (!server) {
    return;
  }

  if (server.connected) {
    server.send("shutdown");
  } else {
    stopProcessTree(server);
  }

  const deadline = Date.now() + 30_000;
  const url = `http://127.0.0.1:${port}`;

  while (Date.now() < deadline) {
    let reachable = false;
    try {
      await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(1000),
      });
      reachable = true;
    } catch {
      reachable = false;
    }

    if (
      !reachable &&
      (server.exitCode !== null || server.signalCode !== null)
    ) {
      activeServer = undefined;
      await delay(1000);
      return;
    }

    await delay(250);
  }

  throw new Error(`Public Next.js server did not release port ${port}.`);
};

const runPlaywright = (mode, port) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(
      process.execPath,
      [
        publicPlaywrightCli,
        "test",
        "--config=playwright.public.config.ts",
        ...forwardedArguments,
      ],
      {
        cwd: import.meta.dirname,
        detached: process.platform !== "win32",
        env: getPublicEnvironment(mode, port),
        stdio: "inherit",
        windowsHide: true,
      }
    );
    activeChild = child;

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (activeChild === child) {
        activeChild = undefined;
      }
      if (signal) {
        reject(new Error(`Public Playwright gate stopped by ${signal}.`));
        return;
      }
      resolveRun(code ?? 1);
    });
  });

if (!forwardedArguments.includes("--list")) {
  const fileSystem = statfsSync(repositoryRoot, { bigint: true });
  const availableBytes = fileSystem.bavail * fileSystem.bsize;

  if (availableBytes < minimumFreeBytes) {
    const availableGiB = Number(availableBytes) / 1024 ** 3;
    throw new Error(
      `Public E2E requires at least 2 GiB free on the workspace drive; ${availableGiB.toFixed(2)} GiB is available.`
    );
  }
}

const requestedPublicMode = process.env.E2E_PUBLIC_GATE_MODE;
if (
  requestedPublicMode !== undefined &&
  requestedPublicMode !== "demo" &&
  requestedPublicMode !== "unavailable"
) {
  throw new Error("E2E_PUBLIC_GATE_MODE must be demo or unavailable");
}
const publicModes = requestedPublicMode
  ? [requestedPublicMode]
  : ["demo", "unavailable"];

try {
  for (const mode of publicModes) {
    const publicPort = await getAvailablePort();
    process.stdout.write(`\n[public-e2e] ${mode} on ${publicPort}\n`);
    await cleanPublicE2EDist(mode);

    try {
      if (mode === "unavailable" && !forwardedArguments.includes("--list")) {
        const buildExitCode = await runPublicBuild(mode, publicPort);
        if (buildExitCode !== 0) {
          process.exitCode = buildExitCode;
          break;
        }
      }

      if (!forwardedArguments.includes("--list")) {
        const serverState = startPublicServer(mode, publicPort);
        await waitForPublicServer(serverState, mode, publicPort);
      }

      const exitCode = await runPlaywright(mode, publicPort);
      if (exitCode !== 0) {
        process.exitCode = exitCode;
        break;
      }
    } finally {
      await stopPublicServer(publicPort);
      restorePublicNextEnv();
    }
  }
} finally {
  for (const mode of publicModes) {
    await cleanPublicE2EDist(mode);
  }
  restorePublicNextEnv();
}
