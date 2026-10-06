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
const desktopWebStylePattern =
  /apps\/web\/app\/\[locale\]\/.*desktop.*\.module\.css$/;
const desktopComponentPattern =
  /\/components\/(?:desktop-|dealer-desktop-).*\.tsx$/;
const mediaConditionPattern = /@media[^{}]+\{/g;
const desktopPalettePattern =
  /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|oklch|color-mix)\(/i;
const desktopDimensionPattern = /(?:^|[\s:(])\d*\.?\d+(?:px|rem|em|ms)\b/;
const desktopTypographyPattern =
  /font-weight:\s*\d|(?:line-height|letter-spacing):\s*-?\d*\.?\d+[;\s]/;
const desktopUtilityPalettePattern =
  /(?:^|\s|:)(?:bg|text|border)-(?:white|black|zinc-|gray-|slate-)/;
const desktopUtilityValuePattern =
  /(?:^|\s|:)(?:rounded|shadow|w|h|min-w|max-w|min-h|max-h|size|grid-cols|grid-rows)-\[([^\]]+)\]/g;
const desktopUtilityLiteralPattern = /\d(?:px|rem)|rgba?\(/;
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
  assert.ok(content.includes("<DealerDesktopStock"));
  const stock = read(
    "packages/marketplace-ui/components/dealer-desktop-stock.tsx"
  );
  assert.ok(stock.startsWith('"use client";'));
  assert.ok(stock.includes("<VehicleCard"));
  assert.ok(!stock.includes("process.env."));
  assert.ok(!stock.includes("@repo/database"));
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

test("desktop presentation values stay in the design system", () => {
  const desktopStyles = files.filter(
    (file) =>
      file.endsWith(".module.css") &&
      ((file.startsWith("packages/marketplace-ui/components/") &&
        (file.includes("desktop") ||
          file.endsWith("dealer-hero-search.module.css") ||
          file.endsWith("dealer-inventory.module.css"))) ||
        desktopWebStylePattern.test(file))
  );
  for (const file of desktopStyles) {
    // Breakpoints and structural grid proportions are layout conditions.
    const declarations = read(file).replace(mediaConditionPattern, "{");
    assert.doesNotMatch(
      declarations,
      desktopPalettePattern,
      `Local desktop palette or colour mix in ${file}`
    );
    assert.doesNotMatch(
      declarations,
      desktopDimensionPattern,
      `Local desktop dimension or timing in ${file}`
    );
    assert.doesNotMatch(
      declarations,
      desktopTypographyPattern,
      `Local desktop typography in ${file}`
    );
  }
  const desktopComponents = publicCode.filter((file) =>
    desktopComponentPattern.test(file)
  );
  for (const file of desktopComponents) {
    const source = ts.createSourceFile(
      file,
      read(file),
      ts.ScriptTarget.Latest,
      true
    );
    const visit = (node) => {
      if (
        ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node)
      ) {
        // Vector flag artwork and intrinsic image dimensions are asset data.
        assert.doesNotMatch(
          node.text,
          desktopUtilityPalettePattern,
          `Local desktop utility palette in ${file}`
        );
        for (const match of node.text.matchAll(desktopUtilityValuePattern)) {
          assert.ok(
            match[1].includes("var(") ||
              !desktopUtilityLiteralPattern.test(match[1]),
            `Local desktop utility dimension in ${file}: ${match[0]}`
          );
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
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
