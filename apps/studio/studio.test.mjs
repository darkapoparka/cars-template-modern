import assert from "node:assert/strict";
import test from "node:test";
import { assertStudioSafety, createStudioProcess } from "./studio.mjs";

const localEnvironment = {
  DATABASE_URL: "postgresql://automarket:secret@127.0.0.1:5432/automarket",
};
const remoteConfirmationPattern = /Remote database access requires/u;
const productionDisabledPattern = /Prisma Studio is disabled/u;
const databaseRequiredPattern = /DATABASE_URL is required/u;
const databaseInvalidPattern = /DATABASE_URL is invalid/u;

test("allows a local database and forces the Studio server onto loopback", () => {
  assert.deepEqual(assertStudioSafety(localEnvironment), {
    databaseHost: "127.0.0.1",
    databaseIdentity: "127.0.0.1:5432/automarket",
    isLoopbackDatabase: true,
    studioHost: "127.0.0.1",
  });

  const processConfiguration = createStudioProcess({
    ...localEnvironment,
    HOST: "0.0.0.0",
  });
  assert.equal(processConfiguration.env.HOST, "127.0.0.1");
  assert.equal(processConfiguration.env.BROWSER, "none");
});

test("rejects a remote database unless its exact identity is explicitly confirmed", () => {
  const remoteEnvironment = {
    ...localEnvironment,
    DATABASE_URL:
      "postgresql://automarket:secret@ep-preview.neon.tech/automarket",
  };

  assert.throws(
    () => assertStudioSafety(remoteEnvironment),
    remoteConfirmationPattern
  );
  assert.throws(
    () =>
      assertStudioSafety({
        ...remoteEnvironment,
        AUTOMARKET_STUDIO_ALLOWED_DATABASE_IDENTITY:
          "ep-other.neon.tech:5432/automarket",
        AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION: "true",
      }),
    remoteConfirmationPattern
  );

  assert.equal(
    assertStudioSafety({
      ...remoteEnvironment,
      AUTOMARKET_STUDIO_ALLOWED_DATABASE_IDENTITY:
        "ep-preview.neon.tech:5432/automarket",
      AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION: "true",
    }).databaseHost,
    "ep-preview.neon.tech"
  );

  assert.throws(
    () =>
      assertStudioSafety({
        ...remoteEnvironment,
        AUTOMARKET_STUDIO_ALLOWED_DATABASE_IDENTITY:
          "ep-preview.neon.tech:5432/automarket_production",
        AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION: "true",
      }),
    remoteConfirmationPattern
  );
});

test("refuses production runtime environments before inspecting a database", () => {
  assert.throws(
    () => assertStudioSafety({ ...localEnvironment, NODE_ENV: "production" }),
    productionDisabledPattern
  );
  assert.throws(
    () => assertStudioSafety({ ...localEnvironment, VERCEL_ENV: "production" }),
    productionDisabledPattern
  );
  assert.throws(
    () => assertStudioSafety({ ...localEnvironment, VERCEL_ENV: "preview" }),
    productionDisabledPattern
  );
});

test("fails closed for missing or malformed database configuration", () => {
  assert.throws(() => assertStudioSafety({}), databaseRequiredPattern);
  assert.throws(
    () => assertStudioSafety({ DATABASE_URL: "not a URL" }),
    databaseInvalidPattern
  );
  assert.throws(
    () =>
      assertStudioSafety({
        DATABASE_URL: "postgresql://user:secret@remote.neon.tech/%ZZ",
      }),
    databaseInvalidPattern
  );
});
