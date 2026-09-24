// biome-ignore-all lint/suspicious/noMisplacedAssertion: Reusable assertions are invoked synchronously inside node:test cases, including negative fixtures.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const sha = (source) => createHash("sha256").update(source).digest("hex");
// Reviewed candidate plus 808d036: reject return paths that normalize to //host.
// Keep this exact-body check so unreviewed policy drift still fails closed.
const portableHash =
  "5cac2494777341dfb0f2cbc886de13a554dee17bfa46ba8b116ddf57a2a700bc";
const portableMarker =
  "/**\n * Framework-neutral locale routing and preference policy.";
function assertPortableMirror(source) {
  const start = source.indexOf(portableMarker);
  assert.ok(start >= 0, "Portable source marker missing");
  assert.equal(
    sha(source.slice(start)),
    portableHash,
    "Portable policy drift requires a new reviewed source hash"
  );
}
function catalog(file) {
  const module = { exports: {} };
  const output = ts.transpileModule(read(file), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    output,
    { module, exports: module.exports },
    { filename: file, timeout: 1000 }
  );
  return module.exports;
}
const tokens = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
const placeholders = (value) => [...new Set(value.match(tokens) ?? [])].sort();
function bilingual(en, bg) {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(bg).sort());
  for (const key of Object.keys(en)) {
    assert.equal(typeof en[key], "string");
    assert.equal(typeof bg[key], "string");
    assert.ok(en[key].trim(), key);
    assert.ok(bg[key].trim(), key);
    assert.deepEqual(placeholders(en[key]), placeholders(bg[key]), key);
  }
}
test("portable policy body exactly matches the reviewed hardened revision", () =>
  assertPortableMirror(read("packages/internationalization/policy.ts")));
test("portable policy drift is detected, not silently blessed by formatting", () =>
  assert.throws(() =>
    assertPortableMirror(`${read("packages/internationalization/policy.ts")}\n`)
  ));
for (const file of [
  "packages/internationalization/preferences-messages.ts",
  "packages/internationalization/public-messages.ts",
]) {
  test(`complete EN/BG keys and interpolation: ${file}`, () => {
    const { en, bg } = catalog(file);
    bilingual(en, bg);
  });
}
test("catalog guard rejects missing, blank and mismatched translations", () => {
  assert.throws(() => bilingual({ title: "Hello" }, {}));
  assert.throws(() => bilingual({ title: "Hello" }, { title: " " }));
  assert.throws(() =>
    bilingual({ title: "Hello {name}" }, { title: "Здравейте {dealer}" })
  );
});
test("all existing sample stock has matching guarded bilingual display copy", () => {
  const { inventoryCopy } = catalog(
    "packages/marketplace/content/inventory-copy.ts"
  );
  const { mockListings } = catalog(
    "packages/marketplace-domain/testing/mock-data.ts"
  );
  assert.equal(Object.keys(inventoryCopy).length, mockListings.length);
  for (const listing of mockListings) {
    const entry = inventoryCopy[listing.slug];
    assert.ok(entry, listing.slug);
    assert.equal(entry.sourceDescription, listing.description, listing.slug);
    assert.deepEqual(
      placeholders(entry.en.description),
      placeholders(entry.bg.description)
    );
    for (const locale of ["en", "bg"]) {
      assert.ok(entry[locale].description.trim());
      assert.equal(entry[locale].imageAlts.length, listing.images.length);
      assert.ok(entry[locale].imageAlts.every((value) => value.trim()));
    }
  }
});
test("visitor preferences remain a dynamic Server Component composition", () => {
  const layout = ts.createSourceFile(
    "layout.tsx",
    read("apps/web/app/[locale]/layout.tsx"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  assert.ok(
    !layout.statements.some(
      (statement) =>
        ts.isExpressionStatement(statement) &&
        ts.isStringLiteral(statement.expression) &&
        statement.expression.text === "use client"
    )
  );
  const source = layout.text;
  assert.ok(source.includes('"force-dynamic"'));
  assert.ok(source.includes("getRequestPreferences"));
  assert.ok(source.includes("LocalePreferencesProvider"));
});
test("native mounting remains configurable rather than a forced locale rewrite", () => {
  const config = read("apps/web/next.config.ts");
  assert.ok(config.includes("nextConfig.basePath = publicBasePath"));
  assert.ok(config.includes("if (publicBasePath)"));
  assert.ok(config.includes("nextConfig.images.unoptimized = true"));
  assert.ok(
    !read("packages/internationalization/request.ts").includes("rewriteDefault")
  );
  assert.ok(
    !read("packages/internationalization/request.ts").includes("cookies.set")
  );
});
