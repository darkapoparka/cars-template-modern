import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (value) => createHash("sha256").update(value).digest("hex");
const git = (...args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
const excluded =
  /(?:^|\/)(?:node_modules|\.turbo|test-results|playwright-report)(?:\/|$)|(?:\.test\.|\.spec\.|tsbuildinfo$|next-env\.d\.ts$)/;
const rootSources = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.json",
  "biome.jsonc",
  ".node-version",
  ".nvmrc",
  ".npmrc",
]);
const paths = [
  ...new Set(
    git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split(
      "\0"
    )
  ),
]
  .filter(
    (file) =>
      file &&
      !excluded.test(file) &&
      (file.startsWith("packages/") ||
        file.startsWith("apps/web/") ||
        rootSources.has(file))
  )
  .sort();
const files = paths
  .filter(
    (file) =>
      fs.existsSync(path.join(root, file)) &&
      fs.statSync(path.join(root, file)).isFile()
  )
  .map((file) => ({
    path: file,
    sha256: sha(fs.readFileSync(path.join(root, file))),
  }));
const manifest = {
  schemaVersion: 1,
  recordedAt: new Date().toISOString(),
  head: git("rev-parse", "HEAD"),
  originMain: git("rev-parse", "origin/main"),
  kind: "working-tree-source-not-release-approval",
  aggregateSha256: sha(JSON.stringify(files)),
  files,
};
const output = path.join(root, "docs/localization/SOURCE-MANIFEST.json");
if (process.argv.includes("--write")) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(
  JSON.stringify(
    {
      head: manifest.head,
      originMain: manifest.originMain,
      aggregateSha256: manifest.aggregateSha256,
      files: files.length,
      written: process.argv.includes("--write"),
    },
    null,
    2
  )
);
