import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const sharp = createRequire(resolve(root, "apps/web/package.json"))("sharp");
const input = await readFile(resolve(import.meta.dirname, "source.png"));
const source = await sharp(input).metadata();
assert(source.width && source.height && source.hasAlpha);
const framed = await sharp(input)
  .trim({ threshold: 8 })
  .extend({
    top: 16,
    bottom: 16,
    left: 16,
    right: 16,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();
const delivery = await sharp(framed)
  .resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 92, effort: 6 })
  .toBuffer();
const size = await sharp(delivery).metadata();
const deliveryPath = "/images/lease/mobile-pdp-finance-cutout-v3.webp";
await writeFile(resolve(root, "apps/web/public", `.${deliveryPath}`), delivery);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
await writeFile(
  resolve(import.meta.dirname, "manifest.json"),
  JSON.stringify(
    {
      generated: "2026-10-06",
      source: "source.png",
      sourceDimensions: [source.width, source.height],
      sourceSha256: sha256(input),
      deliveryPath,
      deliveryDimensions: [size.width, size.height],
      deliverySha256: sha256(delivery),
      bytes: delivery.length,
      preparation:
        "Trim empty alpha padding with threshold 8, restore a 16px transparent safety margin, resize and encode WebP. No repainting or object movement.",
    },
    null,
    2
  )
);
console.log(
  JSON.stringify({
    width: size.width,
    height: size.height,
    bytes: delivery.length,
  })
);
