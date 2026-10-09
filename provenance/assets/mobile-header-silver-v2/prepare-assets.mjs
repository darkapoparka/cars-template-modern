import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const provenance = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(provenance, "../../..");
const require = createRequire(path.join(root, "apps/web/package.json"));
const sharp = require("sharp");
const publicAssets = path.join(root, "apps/web/public/images/services");
const roles = [
  ["car", "header-car-v1.png", 28],
  ["bike", "header-motorbike-silver-v1.png", 34],
  ["truck", "header-truck-silver-v1.png", 34],
  ["van", "header-van-silver-v1.png", 34],
  ["guides", "header-guides-v1.png", 28],
  ["filters", "header-filters-v1.png", 28],
  ["info", "header-info-v1.png", 28],
  ["location", "header-location-v1.png", 28],
  ["phone", "phone-source.png", 28],
];

await mkdir(publicAssets, { recursive: true });
const manifest = {
  prepared: "2026-10-06",
  description:
    "Existing header artwork at its original framing; new diagonal silver phone.",
  delivery:
    "Transparent WebP at four times the rendered CSS size, served directly.",
  assets: [],
};
for (const [role, sourceName, cssSize] of roles) {
  const source = path.join(
    role === "phone" ? provenance : publicAssets,
    sourceName
  );
  const sourceBytes = await readFile(source);
  const sourceMetadata = await sharp(sourceBytes).metadata();
  const canvasSize = cssSize * 4;
  const filename = `header-silver-${role}-v2.webp`;
  const output = path.join(publicAssets, filename);
  await sharp(sourceBytes)
    .resize(canvasSize, canvasSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 94, alphaQuality: 100, effort: 6 })
    .toFile(output);
  const bytes = await readFile(output);
  const raw = await sharp(bytes).ensureAlpha().raw().toBuffer();
  const corners = [
    3,
    (canvasSize - 1) * 4 + 3,
    canvasSize * (canvasSize - 1) * 4 + 3,
    (canvasSize * canvasSize - 1) * 4 + 3,
  ].map((index) => raw[index]);
  if (corners.some((alpha) => alpha !== 0)) {
    throw new Error(`Opaque corner in ${filename}`);
  }
  let left = canvasSize;
  let top = canvasSize;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      if (raw[(y * canvasSize + x) * 4 + 3] > 16) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  manifest.assets.push({
    role,
    source: role === "phone" ? sourceName : `/images/services/${sourceName}`,
    sourceDimensions: [sourceMetadata.width, sourceMetadata.height],
    sourceBytes: sourceBytes.length,
    sourceSha256: createHash("sha256").update(sourceBytes).digest("hex"),
    path: `/images/services/${filename}`,
    canvas: [canvasSize, canvasSize],
    cssSize,
    visibleCssBounds: [
      left / 4,
      top / 4,
      (right - left + 1) / 4,
      (bottom - top + 1) / 4,
    ],
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    cornerAlpha: corners,
  });
}
await writeFile(
  path.join(provenance, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`
);
console.log(
  JSON.stringify(
    {
      assets: manifest.assets.map(
        ({ role, sourceBytes, bytes, visibleCssBounds }) => ({
          role,
          sourceBytes,
          bytes,
          visibleCssBounds,
        })
      ),
      totalSourceBytes: manifest.assets.reduce(
        (sum, asset) => sum + asset.sourceBytes,
        0
      ),
      totalDeliveryBytes: manifest.assets.reduce(
        (sum, asset) => sum + asset.bytes,
        0
      ),
    },
    null,
    2
  )
);
