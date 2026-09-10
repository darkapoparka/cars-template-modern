import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = path.join(root, "packages");
const SOURCE_FILE_PATTERN = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const TEST_FILE_PATTERN = /\.(?:test|spec)\.(?:ts|tsx|mts|cts)$/;
const TYPESCRIPT_EXTENSION_PATTERN = /\.ts$/;
const REPO_PACKAGE_IMPORT_PATTERN =
  /(?:from\s+|import\s*\(|import\s+)["'](@repo\/[^/"']+)/g;
const REPO_IMPORT_SPECIFIER_PATTERN =
  /(?:from\s+|import\s*\(|import\s+)["'](@repo\/[^/"']+(?:\/[^"']+)?)["']/g;
const INVENTORY_CSV_EXPORT_PATTERN = /inventory-csv/;
const DOMAIN_ROOT_EXPORT_PATTERN = /^export \* from "\.\/([^"\n]+)";$/gm;
const FORBIDDEN_DOMAIN_IMPORT_PATTERN =
  /(?:from\s+|import\s*\(|import\s+)["'](?:@repo\/|node:|next(?:\/|["'])|react(?:\/|["']))/;
const SERVER_ONLY_IMPORT_PATTERN = /^import "server-only";$/m;
const RADIX_IMPORT_PATTERN = /from ["']radix-ui["']/;
const CLIENT_COMPONENT_DIRECTIVE_PATTERN = /^\s*["']use client["'];?/;
const PACKAGE_EXPORT_SUBPATH_PATTERN = /^\.($|\/)/;
const PACKAGE_EXPORT_TARGET_PATTERN = /^\.\/(?!.*(?:^|\/)\.\.(?:\/|$))/;

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

const packageDirectories = async () =>
  (await readdir(packagesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesRoot, entry.name));

const loadWorkspacePackages = async () => {
  const packages = new Map();
  for (const directory of await packageDirectories()) {
    const manifest = await readJson(path.join(directory, "package.json")).catch(
      () => null
    );
    if (manifest?.name) {
      packages.set(manifest.name, { directory, manifest });
    }
  }
  return packages;
};

const internalDependencies = (manifest, workspacePackages) =>
  new Set(
    [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ].filter((dependency) => workspacePackages.has(dependency))
  );

const runtimeInternalDependencies = (manifest, workspacePackages) =>
  new Set(
    [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ].filter((dependency) => workspacePackages.has(dependency))
  );

const sourceFiles = async (directory) => {
  const files = [];
  const visit = async (current) => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (
        entry.name.startsWith(".next-") ||
        [
          ".next",
          ".turbo",
          "coverage",
          "dist",
          "generated",
          "node_modules",
          "playwright-report",
          "test-results",
        ].includes(entry.name)
      ) {
        continue;
      }
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(target);
      } else if (SOURCE_FILE_PATTERN.test(entry.name)) {
        files.push(target);
      }
    }
  };
  await visit(directory);
  return files;
};

const productionSource = (file) => !TEST_FILE_PATTERN.test(file);

const workspaceSourceFiles = async () => {
  const files = [];
  for (const directory of ["apps", "packages", "scripts"]) {
    const target = path.join(root, directory);
    files.push(...(await sourceFiles(target)));
  }
  return files;
};

const importedRepoPackages = async (directory) => {
  const imports = new Map();
  for (const file of (await sourceFiles(directory)).filter(productionSource)) {
    const source = await readFile(file, "utf8");
    REPO_PACKAGE_IMPORT_PATTERN.lastIndex = 0;
    const matches = source.matchAll(REPO_PACKAGE_IMPORT_PATTERN);
    for (const match of matches) {
      const dependency = match[1];
      const entries = imports.get(dependency) ?? [];
      entries.push(path.relative(root, file).replaceAll("\\", "/"));
      imports.set(dependency, entries);
    }
  }
  return imports;
};

test("low-level packages cannot import feature or peer infrastructure packages", async () => {
  const workspace = await loadWorkspacePackages();
  const rules = new Map([
    ["@repo/ai", new Set(["@repo/marketplace"])],
    [
      "@repo/database",
      new Set(["@repo/ai", "@repo/auth", "@repo/marketplace", "@repo/storage"]),
    ],
    ["@repo/storage", new Set(["@repo/marketplace"])],
  ]);

  for (const [packageName, forbidden] of rules) {
    const pkg = workspace.get(packageName);
    assert.ok(pkg, `${packageName} must exist`);
    const declared = internalDependencies(pkg.manifest, workspace);
    const imports = await importedRepoPackages(pkg.directory);
    for (const dependency of forbidden) {
      assert.equal(
        declared.has(dependency),
        false,
        `${packageName} must not declare ${dependency}`
      );
      assert.deepEqual(
        imports.get(dependency) ?? [],
        [],
        `${packageName} must not import ${dependency}`
      );
    }
  }
});

test("marketplace-domain stays dependency-light and browser-safe at its root", async () => {
  const workspace = await loadWorkspacePackages();
  const domain = workspace.get("@repo/marketplace-domain");
  assert.ok(domain, "@repo/marketplace-domain must exist");

  const runtimeDependencies = Object.keys(domain.manifest.dependencies ?? {});
  assert.deepEqual(runtimeDependencies, ["zod"]);
  assert.equal(
    internalDependencies(domain.manifest, workspace).size,
    1,
    "marketplace-domain may only reference the shared TypeScript config"
  );

  const indexSource = await readFile(
    path.join(domain.directory, "index.ts"),
    "utf8"
  );
  assert.doesNotMatch(indexSource, INVENTORY_CSV_EXPORT_PATTERN);

  const rootModules = [...indexSource.matchAll(DOMAIN_ROOT_EXPORT_PATTERN)]
    .map((match) => match[1])
    .sort();
  const browserSafeModules = (
    await readdir(domain.directory, {
      withFileTypes: true,
    })
  )
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".ts") &&
        !["index.ts", "inventory-csv.ts"].includes(entry.name) &&
        !TEST_FILE_PATTERN.test(entry.name)
    )
    .map((entry) => entry.name.replace(TYPESCRIPT_EXTENSION_PATTERN, ""))
    .sort();
  assert.deepEqual(
    rootModules,
    browserSafeModules,
    "marketplace-domain root must export every browser-safe top-level contract module"
  );

  const expectedExports = Object.fromEntries([
    [".", "./index.ts"],
    ...browserSafeModules.map((module) => [`./${module}`, `./${module}.ts`]),
    ["./inventory-csv", "./inventory-csv.ts"],
    ["./testing/mock-data", "./testing/mock-data.ts"],
  ]);
  assert.deepEqual(
    domain.manifest.exports,
    expectedExports,
    "marketplace-domain must expose only its deliberate root, contract, Node-only, and testing entry points"
  );

  for (const file of (await sourceFiles(domain.directory)).filter(
    (candidate) =>
      productionSource(candidate) &&
      path.basename(candidate) !== "inventory-csv.ts"
  )) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(
      source,
      FORBIDDEN_DOMAIN_IMPORT_PATTERN,
      `${path.relative(root, file)} must remain browser-safe and workspace-independent`
    );
  }
});

test("workspace package dependency graph is acyclic", async () => {
  const workspace = await loadWorkspacePackages();
  const visiting = new Set();
  const visited = new Set();

  const visit = (name, trail = []) => {
    if (visiting.has(name)) {
      assert.fail(
        `workspace dependency cycle: ${[...trail, name].join(" -> ")}`
      );
    }
    if (visited.has(name)) {
      return;
    }
    visiting.add(name);
    const pkg = workspace.get(name);
    for (const dependency of internalDependencies(pkg.manifest, workspace)) {
      visit(dependency, [...trail, name]);
    }
    visiting.delete(name);
    visited.add(name);
  };

  for (const name of workspace.keys()) {
    visit(name);
  }
});

test("workspace runtime dependencies match the deliberate package graph", async () => {
  const workspace = await loadWorkspacePackages();
  const allowedDependencies = new Map([
    ["@repo/ai", ["@repo/marketplace-domain"]],
    ["@repo/database", ["@repo/marketplace-domain"]],
    ["@repo/marketplace-ui", ["@repo/design-system", "@repo/marketplace"]],
    ["@repo/marketplace", ["@repo/marketplace-domain"]],
    ["@repo/storage", ["@repo/marketplace-domain"]],
  ]);

  for (const [packageName, pkg] of workspace) {
    const actual = [
      ...runtimeInternalDependencies(pkg.manifest, workspace),
    ].sort();
    const expected = [...(allowedDependencies.get(packageName) ?? [])].sort();

    assert.deepEqual(
      actual,
      expected,
      `${packageName} runtime workspace dependencies must match the documented architecture`
    );
  }
});

test("workspace packages expose explicit, existing public entry points", async () => {
  const workspace = await loadWorkspacePackages();

  for (const [packageName, pkg] of workspace) {
    const exports = pkg.manifest.exports;
    assert.ok(
      exports &&
        typeof exports === "object" &&
        !Array.isArray(exports) &&
        Object.keys(exports).length > 0,
      `${packageName} must define an explicit exports map`
    );

    for (const [subpath, target] of Object.entries(exports)) {
      assert.match(
        subpath,
        PACKAGE_EXPORT_SUBPATH_PATTERN,
        `${packageName} export keys must be package subpaths`
      );
      assert.equal(
        typeof target,
        "string",
        `${packageName} ${subpath} must resolve directly to one source entry point`
      );
      assert.match(
        target,
        PACKAGE_EXPORT_TARGET_PATTERN,
        `${packageName} ${subpath} must stay inside its package`
      );
      await assert.doesNotReject(
        access(path.join(pkg.directory, target)),
        `${packageName} ${subpath} must target an existing file`
      );
    }
  }
});

test("every workspace package import uses a declared export subpath", async () => {
  const workspace = await loadWorkspacePackages();

  for (const file of await workspaceSourceFiles()) {
    const source = await readFile(file, "utf8");
    REPO_IMPORT_SPECIFIER_PATTERN.lastIndex = 0;
    for (const match of source.matchAll(REPO_IMPORT_SPECIFIER_PATTERN)) {
      const specifier = match[1];
      const [scope, packageSegment, ...subpathSegments] = specifier.split("/");
      const packageName = `${scope}/${packageSegment}`;
      const pkg = workspace.get(packageName);

      assert.ok(
        pkg,
        `${path.relative(root, file)} imports missing workspace package ${packageName}`
      );

      const exportKey =
        subpathSegments.length === 0 ? "." : `./${subpathSegments.join("/")}`;
      assert.ok(
        Object.hasOwn(pkg.manifest.exports ?? {}, exportKey),
        `${path.relative(root, file)} imports undeclared ${specifier} (${exportKey})`
      );
    }
  }
});

test("workspace TypeScript configs extend declared package exports", async () => {
  const workspace = await loadWorkspacePackages();

  for (const baseDirectory of ["apps", "packages"]) {
    const directory = path.join(root, baseDirectory);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }

      const configPath = path.join(directory, entry.name, "tsconfig.json");
      const config = await readJson(configPath).catch(() => null);
      if (!config) {
        continue;
      }

      const extendedConfigs = Array.isArray(config.extends)
        ? config.extends
        : [config.extends].filter(Boolean);
      for (const specifier of extendedConfigs.filter((value) =>
        value.startsWith("@repo/")
      )) {
        const [scope, packageSegment, ...subpathSegments] =
          specifier.split("/");
        const packageName = `${scope}/${packageSegment}`;
        const exportKey = `./${subpathSegments.join("/")}`;
        const pkg = workspace.get(packageName);

        assert.ok(
          pkg,
          `${path.relative(root, configPath)} extends missing package ${packageName}`
        );
        assert.ok(
          Object.hasOwn(pkg.manifest.exports ?? {}, exportKey),
          `${path.relative(root, configPath)} extends undeclared ${specifier}`
        );
      }
    }
  }
});

test("tests wait for upstream builds that may regenerate consumed artifacts", async () => {
  const turbo = await readJson(path.join(root, "turbo.json"));

  assert.deepEqual(
    turbo.tasks?.test?.dependsOn,
    ["^build", "^test"],
    "test tasks must not import an upstream generated artifact while its build is rewriting that artifact"
  );
});

test("repository-wide Turbo inputs stay limited to universal execution context", async () => {
  const turbo = await readJson(path.join(root, "turbo.json"));

  assert.deepEqual(turbo.globalDependencies, [".node-version", ".nvmrc"]);
  assert.deepEqual(turbo.globalEnv, ["CI", "NODE_ENV", "SKIP_ENV_VALIDATION"]);
  assert.deepEqual(turbo.globalPassThroughEnv, [
    "PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN",
  ]);

  for (const appName of ["api", "app", "web"]) {
    const appTurbo = await readJson(
      path.join(root, "apps", appName, "turbo.json")
    );
    assert.ok(
      appTurbo.tasks?.build?.env?.length > 0,
      `${appName} must own its build environment cache inputs`
    );
    assert.deepEqual(
      appTurbo.tasks.build.inputs,
      ["$TURBO_DEFAULT$", ".env", ".env.*local"],
      `${appName} must scope local environment files to its own build cache`
    );
  }
});

test("provider-backed server entry points reject Client Component imports", async () => {
  const workspace = await loadWorkspacePackages();
  const serverEntryPoints = new Map([
    ["@repo/cms", ["index.ts"]],
    ["@repo/email", ["index.ts"]],
    ["@repo/notifications", ["index.ts"]],
    ["@repo/rate-limit", ["idempotency.ts", "index.ts"]],
    [
      "@repo/storage",
      [
        "index.ts",
        "inventory-imports.ts",
        "photo-processing.ts",
        "private-documents.ts",
      ],
    ],
  ]);

  for (const [packageName, entryPoints] of serverEntryPoints) {
    const pkg = workspace.get(packageName);
    assert.ok(pkg, `${packageName} must exist`);
    assert.equal(
      pkg.manifest.dependencies?.["server-only"],
      "^0.0.1",
      `${packageName} must declare its server-only runtime fence`
    );

    for (const entryPoint of entryPoints) {
      const source = await readFile(
        path.join(pkg.directory, entryPoint),
        "utf8"
      );
      assert.match(
        source,
        SERVER_ONLY_IMPORT_PATTERN,
        `${packageName}/${entryPoint} must reject Client Component imports`
      );
    }
  }
});

test("Radix-backed design-system primitives are Client Components", async () => {
  const componentsDirectory = path.join(
    packagesRoot,
    "design-system",
    "components",
    "ui"
  );

  for (const file of await sourceFiles(componentsDirectory)) {
    const source = await readFile(file, "utf8");
    if (RADIX_IMPORT_PATTERN.test(source)) {
      assert.match(
        source,
        CLIENT_COMPONENT_DIRECTIVE_PATTERN,
        `${path.relative(root, file)} must not evaluate Radix against the React Server Components runtime`
      );
    }
  }
});
