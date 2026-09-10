import { lstat, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const textExtensions = new Set([".json", ".log", ".txt", ".xml"]);
const maximumTextBytes = 12 * 1024 * 1024;
const embeddedBinaryPattern =
  /(?:data:[^;\s]+;base64,|[A-Za-z\d+/_-]{512,}={0,2})/i;
const allowedTextControlCodes = new Set([0x09, 0x0a, 0x0d]);

const containsInvalidText = (source) => {
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    if (
      code === 0xff_fd ||
      (code < 0x20 && !allowedTextControlCodes.has(code))
    ) {
      return true;
    }
  }
  return false;
};

const redact = (source, environment) => {
  let result = source
    .replaceAll(
      /eyJ[A-Za-z\d_-]+\.[A-Za-z\d_-]+\.[A-Za-z\d_-]+/g,
      "[REDACTED_JWT]"
    )
    .replaceAll(
      /(cookie|set-cookie|authorization)(\s*[:=]\s*)[^\r\n<]+/gi,
      "$1$2[REDACTED]"
    )
    .replaceAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replaceAll(/\b(?:user|org|sess)_[A-Za-z\d_-]+\b/g, "[REDACTED_CLERK_ID]");

  for (const name of [
    "CLERK_SECRET_KEY",
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_TESTING_TOKEN",
    "E2E_VERCEL_TOKEN",
    "E2E_WEB_VERCEL_AUTOMATION_BYPASS_SECRET",
    "E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET",
    "E2E_API_VERCEL_AUTOMATION_BYPASS_SECRET",
  ]) {
    const value = environment[name];
    if (value && value.length >= 8) {
      result = result.replaceAll(value, `[REDACTED_${name}]`);
    }
  }
  return result;
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else {
      files.push(path);
    }
  }
  return files;
};

const isWithinRoots = (file, roots) =>
  roots.some(
    (root) =>
      file.startsWith(`${root}\\`) ||
      file.startsWith(`${root}/`) ||
      file === root
  );

const filesForRoot = async (root) => {
  try {
    return await walk(root);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const sanitizeArtifact = async (file, environment) => {
  const extension = extname(file).toLowerCase();
  if (!textExtensions.has(extension)) {
    await rm(file, { force: true });
    return "removed";
  }
  const stats = await lstat(file);
  if (!stats.isFile()) {
    await rm(file, { force: true });
    return "removed";
  }
  if (stats.size > maximumTextBytes) {
    await rm(file, { force: true });
    return "removed";
  }
  const source = await readFile(file, "utf8");
  if (containsInvalidText(source) || embeddedBinaryPattern.test(source)) {
    await rm(file, { force: true });
    return "removed";
  }
  const sanitized = redact(source, environment);
  if (sanitized === source) {
    return "unchanged";
  }
  await writeFile(file, sanitized, "utf8");
  return "redacted";
};

export const redactAuthenticatedPreviewArtifacts = async ({
  environment = process.env,
  roots,
}) => {
  const absoluteRoots = roots.map((root) => resolve(root));
  let removed = 0;
  let redacted = 0;

  for (const root of absoluteRoots) {
    const files = await filesForRoot(root);
    for (const file of files) {
      if (!isWithinRoots(file, absoluteRoots)) {
        throw new Error(
          "Refusing to redact artifacts outside an approved root"
        );
      }
      const outcome = await sanitizeArtifact(file, environment);
      if (outcome === "removed") {
        removed += 1;
      } else if (outcome === "redacted") {
        redacted += 1;
      }
    }
  }

  return { redacted, removed };
};

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const roots = process.argv.slice(2);
  if (roots.length === 0) {
    throw new Error("At least one artifact directory is required");
  }
  const result = await redactAuthenticatedPreviewArtifacts({ roots });
  process.stdout.write(
    `Authenticated Preview text evidence sanitized: ${result.redacted} files redacted, ${result.removed} binary, embedded, HTML, or non-allowlisted files removed.\n`
  );
}
