import assert from "node:assert/strict";
import test from "node:test";
import {
  databaseIdentity,
  isConfigured,
  isRemoteHttpsOrigin,
  isRemoteHttpsProviderUrl,
  parseEnvText,
} from "./release-environment.mjs";

const duplicateDeclarationPattern = /duplicate/;

test("environment parsing preserves quoted content and rejects duplicate declarations", () => {
  assert.deepEqual(
    parseEnvText('# comment\nexport NAME="value with spaces"\nEMPTY=\n'),
    { NAME: "value with spaces", EMPTY: "" }
  );
  assert.throws(
    () => parseEnvText("NAME=one\nNAME=two"),
    duplicateDeclarationPattern
  );
  assert.equal(isConfigured(" token "), false);
  assert.equal(isConfigured("replace-me"), false);
});
test("deployment origins reject credentials, paths, reserved names and literal IP addresses", () => {
  for (const origin of [
    "http://localhost:3000",
    "https://127.0.0.1",
    "https://[::1]",
    "https://site.invalid",
    "https://site.example.com",
    "https://dealer.com/path",
    "https://user:password@dealer.com",
  ]) {
    assert.equal(isRemoteHttpsOrigin(origin), false, origin);
  }
  assert.equal(isRemoteHttpsOrigin("https://dealer.com"), true);
  assert.equal(
    isRemoteHttpsProviderUrl("https://user:password@provider.com/api"),
    false
  );
});
test("database identity ignores credentials and normalizes equivalent PostgreSQL URLs", () => {
  assert.equal(
    databaseIdentity("postgresql://user:secret@db.neon.tech/catalog"),
    "db.neon.tech:5432/catalog"
  );
  assert.equal(
    databaseIdentity("postgres://other:changed@db.neon.tech:5432/catalog"),
    "db.neon.tech:5432/catalog"
  );
  assert.equal(
    databaseIdentity("postgres://user:secret@localhost/catalog"),
    undefined
  );
});
