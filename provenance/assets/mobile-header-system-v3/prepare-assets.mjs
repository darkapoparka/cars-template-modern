import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const provenance = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(provenance, "../../..");
const require = createRequire(path.join(root, "apps/web/package.json"));
const sharp = require("sharp");
const source = await readFile(path.join(provenance, "source.png"));
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const outputDirectory = path.join(root, "apps/web/public/images/services");
await mkdir(outputDirectory, { recursive: true });
const canvas = 112;
const roles = [
  "car",
  "bike",
  "truck",
  "van",
  "guides",
  "filters",
  "info",
  "location",
  "phone",
];
const manifest = {
  generated: "2026-10-06",
  source: "source.png",
  sourceDimensions: [info.width, info.height],
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  deliveryCanvas: [canvas, canvas],
  cssSize: 28,
  alignment:
    "One centered 28px artwork slot. Vehicles share a 24px wheel baseline and a 22px height limit, with the slot lifted 2px to clear the common chevron. Other symbols are centered by visible alpha bounds.",
  assets: [],
};

const visibleBounds = (pixels, width, height, threshold) => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] > threshold) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left) {
    throw new Error("Empty artwork");
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
};

for (let index = 0; index < roles.length; index++) {
  const role = roles[index];
  const col = index % 3;
  const row = Math.floor(index / 3);
  const x0 = Math.floor((col * info.width) / 3);
  const y0 = Math.floor((row * info.height) / 3);
  const x1 = Math.floor(((col + 1) * info.width) / 3);
  const y1 = Math.floor(((row + 1) * info.height) / 3);
  const width = x1 - x0;
  const height = y1 - y0;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  // Find real cutouts, including the help dot and three separate sliders.
  // Tiny isolated generation specks must not determine the framing rectangle.
  for (let start = 0; start < visited.length; start++) {
    if (visited[start]) {
      continue;
    }
    const sx = start % width;
    const sy = Math.floor(start / width);
    if (data[((sy + y0) * info.width + sx + x0) * 4 + 3] <= 32) {
      continue;
    }
    let head = 0;
    let tail = 1;
    queue[0] = start;
    visited[start] = 1;
    let left = sx,
      right = sx,
      top = sy,
      bottom = sy;
    while (head < tail) {
      const point = queue[head++];
      const x = point % width;
      const y = Math.floor(point / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
            continue;
          }
          const next = ny * width + nx;
          if (visited[next]) {
            continue;
          }
          if (data[((ny + y0) * info.width + nx + x0) * 4 + 3] > 32) {
            visited[next] = 1;
            queue[tail++] = next;
          }
        }
      }
    }
    components.push({ pixels: tail, left, right, top, bottom });
  }
  const largest = Math.max(...components.map((part) => part.pixels));
  if (!(largest > 200)) {
    throw new Error(`Missing icon in ${role} cell`);
  }
  const retained = components.filter(
    (part) => part.pixels >= Math.max(32, largest * 0.01)
  );
  const left = Math.max(0, Math.min(...retained.map((part) => part.left)) - 4);
  const top = Math.max(0, Math.min(...retained.map((part) => part.top)) - 4);
  const right = Math.min(
    width,
    Math.max(...retained.map((part) => part.right)) + 5
  );
  const bottom = Math.min(
    height,
    Math.max(...retained.map((part) => part.bottom)) + 5
  );
  const crop = {
    left: x0 + left,
    top: y0 + top,
    width: right - left,
    height: bottom - top,
  };
  const category = index < 4;
  const resized = await sharp(source)
    .extract(crop)
    .resize({ width: 96, height: category ? 88 : 96, fit: "inside" })
    .png()
    .toBuffer();
  const intermediate = await sharp(resized)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const tight = visibleBounds(
    intermediate.data,
    intermediate.info.width,
    intermediate.info.height,
    8
  );
  const cutout = await sharp(resized).extract(tight).png().toBuffer();
  const cutoutMetadata = await sharp(cutout).metadata();
  const position = {
    left: Math.floor((canvas - cutoutMetadata.width) / 2),
    top: category
      ? 96 - cutoutMetadata.height
      : Math.floor((canvas - cutoutMetadata.height) / 2),
  };
  const filename = `header-system-${role}-v3.webp`;
  const output = path.join(outputDirectory, filename);
  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: cutout, ...position }])
    .webp({ quality: 96, alphaQuality: 100, effort: 6 })
    .toFile(output);
  const bytes = await readFile(output);
  const raw = await sharp(bytes).ensureAlpha().raw().toBuffer();
  const ink = visibleBounds(raw, canvas, canvas, 8);
  const centerX = (ink.left + ink.width / 2) / 4;
  const centerY = (ink.top + ink.height / 2) / 4;
  const baseline = (ink.top + ink.height) / 4;
  const corners = [
    3,
    (canvas - 1) * 4 + 3,
    canvas * (canvas - 1) * 4 + 3,
    (canvas * canvas - 1) * 4 + 3,
  ].map((offset) => raw[offset]);
  if (corners.some((alpha) => alpha !== 0)) {
    throw new Error(`Opaque corner in ${role}`);
  }
  if (Math.abs(centerX - 14) > 0.25) {
    throw new Error(`Horizontal centering drift in ${role}`);
  }
  if (
    category ? Math.abs(baseline - 24) > 0.25 : Math.abs(centerY - 14) > 0.25
  ) {
    throw new Error(`Vertical alignment drift in ${role}`);
  }
  manifest.assets.push({
    role,
    path: `/images/services/${filename}`,
    sourceCell: [x0, y0, width, height],
    crop,
    significantComponents: retained.length,
    tinyComponentsIgnoredForFraming: components.length - retained.length,
    visibleCssBounds: [
      ink.left / 4,
      ink.top / 4,
      ink.width / 4,
      ink.height / 4,
    ],
    centerCss: [centerX, centerY],
    vehicleBaselineCss: category ? baseline : null,
    cornerAlpha: corners,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
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
        ({ role, visibleCssBounds, centerCss, vehicleBaselineCss, bytes }) => ({
          role,
          visibleCssBounds,
          centerCss,
          vehicleBaselineCss,
          bytes,
        })
      ),
      totalBytes: manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0),
    },
    null,
    2
  )
);
