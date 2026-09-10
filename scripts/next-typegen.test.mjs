import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const repositoryRoot = resolve(import.meta.dirname, "..");
const wrapper = resolve(import.meta.dirname, "next-typegen.mjs");
const validationSkipPattern = /skip=true/u;
const typegenFailurePattern = /typegen failed/u;
const hiddenFailurePattern = /reported a hidden runtime failure/u;
const childExecutionPattern = /child must not run/u;
const deploymentRefusalPattern =
  /refuses Vercel Preview or Production environments/u;
const loopbackOriginsPattern =
  /web=http:\/\/localhost:3001 app=http:\/\/localhost:3000 api=http:\/\/localhost:3002/u;
const suppliedOriginsPattern =
  /web=https:\/\/web-preview\.example\.test app=https:\/\/app-preview\.example\.test api=https:\/\/api-preview\.example\.test/u;

const runFixture = (source, environment = {}) => {
  const fixtureDirectory = mkdtempSync(
    resolve(tmpdir(), "automarket-next-typegen-")
  );
  const fixture = resolve(fixtureDirectory, "next-fixture.mjs");
  writeFileSync(fixture, source, "utf8");

  const result = spawnSync(process.execPath, [wrapper], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      AUTOMARKET_NEXT_TYPEGEN_TEST_CLI: fixture,
      NODE_ENV: "test",
      VERCEL_ENV: "development",
      ...environment,
    },
  });

  rmSync(fixtureDirectory, { force: true, recursive: true });
  return result;
};

test("passes a successful provider-free Next route type generation", () => {
  const result = runFixture(
    'console.log("skip=" + process.env.SKIP_ENV_VALIDATION); console.log("web=" + process.env.NEXT_PUBLIC_WEB_URL + " app=" + process.env.NEXT_PUBLIC_APP_URL + " api=" + process.env.NEXT_PUBLIC_API_URL);\n'
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, validationSkipPattern);
  assert.match(result.stdout, loopbackOriginsPattern);
});

test("preserves explicitly supplied origins instead of fabricating replacements", () => {
  const result = runFixture(
    'console.log("web=" + process.env.NEXT_PUBLIC_WEB_URL + " app=" + process.env.NEXT_PUBLIC_APP_URL + " api=" + process.env.NEXT_PUBLIC_API_URL);\n',
    {
      NEXT_PUBLIC_API_URL: "https://api-preview.example.test",
      NEXT_PUBLIC_APP_URL: "https://app-preview.example.test",
      NEXT_PUBLIC_WEB_URL: "https://web-preview.example.test",
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, suppliedOriginsPattern);
});

test("refuses to apply the provider-free bypass in Vercel deployments", () => {
  const result = runFixture('console.log("child must not run");\n', {
    VERCEL_ENV: "production",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, deploymentRefusalPattern);
  assert.doesNotMatch(result.stdout, childExecutionPattern);
});

test("propagates the Next CLI exit code", () => {
  const result = runFixture(
    'process.stderr.write("typegen failed\\n"); process.exitCode = 17;\n'
  );

  assert.equal(result.status, 17);
  assert.match(result.stderr, typegenFailurePattern);
});

test("turns an unhandled-rejection false green into a failing result", () => {
  const result = runFixture(`
process.stderr.write("Unhandled ");
setImmediate(() => process.stderr.write("Rejection while loading config\\n"));
  `);

  assert.equal(result.status, 1);
  assert.match(result.stderr, hiddenFailurePattern);
});

test("turns an environment-validation false green into a failing result", () => {
  const result = runFixture(
    'process.stdout.write("Invalid environment variables\\n");\n'
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, hiddenFailurePattern);
});

test("turns an explicit environment-contract false green into a failing result", () => {
  const result = runFixture(
    'process.stdout.write("Environment contract violation: deployment bypass\\n");\n'
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, hiddenFailurePattern);
});
