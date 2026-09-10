import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  previewPersonas,
  storageStateEnvironmentName,
  validateAuthenticatedPreviewEnvironment,
} from "../apps/e2e/fixtures/authenticated-preview-contract.mts";
import { verifyAuthenticatedPreviewCandidate } from "../apps/e2e/fixtures/authenticated-preview-vercel.mts";

const repositoryRoot = resolve(import.meta.dirname, "..");
const childEnvironmentExclusions = new Set([
  "E2E_VERCEL_TOKEN",
  ...previewPersonas.map(
    (persona) => `E2E_${persona.toUpperCase()}_STORAGE_STATE_B64`
  ),
]);

const run = (command, arguments_, options) =>
  new Promise((resolveRun, reject) => {
    const child = spawn(command, arguments_, options);
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Authenticated Preview E2E terminated by ${signal}`));
        return;
      }
      resolveRun(code ?? 1);
    });
  });

export const runAuthenticatedPreview = async ({
  candidateVerifier = verifyAuthenticatedPreviewCandidate,
  environment = process.env,
  runner = run,
} = {}) => {
  validateAuthenticatedPreviewEnvironment(environment);
  await candidateVerifier({ environment });
  process.stdout.write(
    "Authenticated Preview candidate integrity verified before browser execution.\n"
  );
  const stateDirectory = await mkdtemp(
    join(tmpdir(), "automarket-authenticated-preview-")
  );
  const childEnvironment = Object.fromEntries(
    Object.entries(environment).filter(
      ([name]) => !childEnvironmentExclusions.has(name)
    )
  );
  childEnvironment.E2E_AUTH_STATE_DIRECTORY = stateDirectory;
  childEnvironment.E2E_CANDIDATE_INTEGRITY_VERIFIED = "true";
  childEnvironment.E2E_PROTECTED_RELEASE = "true";
  for (const persona of previewPersonas) {
    childEnvironment[storageStateEnvironmentName(persona)] = join(
      stateDirectory,
      `${persona}.json`
    );
  }

  const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  try {
    let exitCode = 1;
    let runnerFailure;
    try {
      exitCode = await runner(
        executable,
        ["--filter", "e2e", "e2e:release:direct", ...process.argv.slice(2)],
        {
          cwd: repositoryRoot,
          env: childEnvironment,
          stdio: "inherit",
          windowsHide: true,
        }
      );
    } catch (error) {
      runnerFailure = error;
    }

    let verificationFailure;
    try {
      await candidateVerifier({ environment });
      process.stdout.write(
        "Authenticated Preview candidate integrity verified after browser execution.\n"
      );
    } catch (error) {
      verificationFailure = error;
    }

    if (runnerFailure && verificationFailure) {
      throw new AggregateError(
        [runnerFailure, verificationFailure],
        "Authenticated Preview execution and post-run candidate verification failed"
      );
    }
    if (runnerFailure) {
      throw runnerFailure;
    }
    if (verificationFailure) {
      throw verificationFailure;
    }
    return exitCode;
  } finally {
    await rm(stateDirectory, { force: true, recursive: true });
  }
};

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  try {
    process.exitCode = await runAuthenticatedPreview();
  } catch (error) {
    process.stderr.write(
      `Authenticated Preview E2E refused to start: ${
        error instanceof Error ? error.message : "unknown error"
      }\n`
    );
    process.exitCode = 1;
  }
}
