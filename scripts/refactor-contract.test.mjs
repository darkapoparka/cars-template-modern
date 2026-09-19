import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  ...new Set(
    execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard"],
      { cwd: root, encoding: "utf8" }
    )
      .trim()
      .split("\n")
  ),
].filter((file) => existsSync(resolve(root, file)));
const literalColorPattern = /#[0-9a-f]{3,8}\b/i;
const cascadeOverridePattern = /!important|:global|nth-child/;
const codePattern = /\.tsx?$/;
const publicCode = files.filter(
  (file) =>
    codePattern.test(file) &&
    (file.startsWith("apps/web/") ||
      file.startsWith("packages/marketplace-ui/"))
);
const read = (file) => readFileSync(resolve(root, file), "utf8");

test("React client/server directives remain in the directive prologue", () => {
  for (const file of publicCode) {
    const source = ts.createSourceFile(
      file,
      read(file),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    let inPrologue = true;
    for (const statement of source.statements) {
      const directive =
        ts.isExpressionStatement(statement) &&
        ts.isStringLiteral(statement.expression)
          ? statement.expression.text
          : undefined;
      if (directive === "use client" || directive === "use server") {
        assert.ok(inPrologue, `Displaced React directive in ${file}`);
      }
      if (!directive) {
        inPrologue = false;
      }
    }
  }
});

test("desktop collection composition enters the shell through a server-created slot", () => {
  const shell = read(
    "packages/marketplace-ui/components/marketplace-shell.tsx"
  );
  assert.ok(shell.includes("desktopDiscoverySlot"));
  assert.ok(!shell.includes('from "./dealer-desktop-discovery-content"'));
  const content = read(
    "packages/marketplace-ui/components/dealer-desktop-discovery-content.tsx"
  );
  assert.ok(!content.includes('"use client"'));
  assert.ok(content.includes("<VehicleCard"));
  assert.ok(
    !files.includes(
      "packages/marketplace-ui/components/desktop-landing-vehicle-card.tsx"
    )
  );
});

test("desktop component styles use shared tokens, not a new literal palette or data-hiding cascade", () => {
  for (const file of [
    "dealer-desktop-header",
    "dealer-desktop-hero",
    "dealer-desktop-toolbar",
    "dealer-desktop-discovery",
    "vehicle-card-desktop",
  ].map((name) => `packages/marketplace-ui/components/${name}.module.css`)) {
    const css = read(file);
    assert.doesNotMatch(css, literalColorPattern, file);
    assert.doesNotMatch(css, cascadeOverridePattern, file);
  }
});

test("presentation does not use the legacy static-demo flag as product identity", () => {
  for (const file of publicCode.filter(
    (file) =>
      file.startsWith("packages/marketplace-ui/") && !file.includes(".test.")
  )) {
    assert.ok(!read(file).includes("leadSite.staticDemoMode"), file);
  }
});

test("new public entry points resolve to owned implementation files", () => {
  for (const pkg of [
    "marketplace",
    "marketplace-domain",
    "marketplace-ui",
    "database",
    "design-system",
  ]) {
    const manifest = JSON.parse(read(`packages/${pkg}/package.json`));
    for (const [name, target] of Object.entries(manifest.exports ?? {})) {
      if (typeof target !== "string" || target.includes("*")) {
        continue;
      }
      assert.ok(
        existsSync(resolve(root, "packages", pkg, target)),
        `${manifest.name}${name}: ${target}`
      );
    }
  }
});

test("trusted dealer binding is retained and hashed by strict-mode web tasks", () => {
  const config = JSON.parse(read("apps/web/turbo.json"));
  for (const name of ["build", "dev", "test", "typecheck", "analyze"]) {
    assert.ok(
      config.tasks[name].env.includes("AUTOMARKET_DEALER_ORG_ID"),
      name
    );
  }
  assert.ok(read("apps/web/.env.example").includes("AUTOMARKET_DEALER_ORG_ID"));
  assert.ok(
    read("apps/e2e/run-public-gate.mjs").includes(
      'AUTOMARKET_DEALER_ORG_ID: ""'
    )
  );
});
