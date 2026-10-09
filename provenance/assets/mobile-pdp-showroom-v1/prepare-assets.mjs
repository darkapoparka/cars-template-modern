import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const sharp = createRequire(resolve(root, "apps/web/package.json"))("sharp");
const input = await readFile(resolve(import.meta.dirname, "source.png"));
const reference = await readFile(
  resolve(import.meta.dirname, "reference.webp")
);
const source = await sharp(input).metadata();
assert(
  source.width && source.height,
  "Generated artwork must have known dimensions"
);
const delivery = await sharp(input)
  .resize({ width: 1080, withoutEnlargement: true })
  .webp({ quality: 92, effort: 6 })
  .toBuffer();
const size = await sharp(delivery).metadata();
const deliveryPath = "/images/lease/mobile-pdp-showroom-blue-hour-v1.webp";
await writeFile(resolve(root, "apps/web/public", `.${deliveryPath}`), delivery);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
await writeFile(
  resolve(import.meta.dirname, "manifest.json"),
  JSON.stringify(
    {
      generated: "2026-10-06",
      reference: "reference.webp",
      referenceSha256: sha256(reference),
      source: "source.png",
      sourceDimensions: [source.width, source.height],
      sourceSha256: sha256(input),
      deliveryPath,
      deliveryDimensions: [size.width, size.height],
      deliverySha256: sha256(delivery),
      bytes: delivery.length,
      preparation:
        "Resize to 1080px and encode WebP. No further crop, repainting or semantic edits.",
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
