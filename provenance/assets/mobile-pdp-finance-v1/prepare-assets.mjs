import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const sharp = createRequire(resolve(root, "apps/web/package.json"))("sharp");
const source = resolve(import.meta.dirname, "source.png");
const output = resolve(
  root,
  "apps/web/public/images/lease/mobile-pdp-finance-silver-v1.webp"
);
const input = await readFile(source);
const metadata = await sharp(input).metadata();
assert(metadata.hasAlpha, "The generated source must retain transparency");
const delivered = await sharp(input)
  .trim({ threshold: 4 })
  .resize({ width: 720, withoutEnlargement: true })
  .webp({ quality: 94, alphaQuality: 100, effort: 6 })
  .toBuffer();
await writeFile(output, delivered);
const size = await sharp(delivered).metadata();
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
await writeFile(
  resolve(import.meta.dirname, "manifest.json"),
  JSON.stringify(
    {
      generated: "2026-10-06",
      source: "source.png",
      sourceDimensions: [metadata.width, metadata.height],
      sourceSha256: hash(input),
      deliveryPath: "/images/lease/mobile-pdp-finance-silver-v1.webp",
      deliveryDimensions: [size.width, size.height],
      deliverySha256: hash(delivered),
      bytes: delivered.length,
      preparation:
        "Trim transparent outer padding; resize to 720px; encode WebP. No repainting or semantic edits.",
    },
    null,
    2
  )
);
console.log(
  JSON.stringify({
    width: size.width,
    height: size.height,
    bytes: delivered.length,
  })
);
