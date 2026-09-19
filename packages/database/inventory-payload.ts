import "server-only";
import { createHash } from "node:crypto";
import type { Prisma } from "./generated/client";

const stableJsonValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(stableJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableJsonValue(entry)])
    );
  }

  return value;
};

export const stableInventoryJson = (value: unknown) =>
  JSON.stringify(stableJsonValue(value));

export const hashInventoryPayload = (value: unknown) =>
  createHash("sha256").update(stableInventoryJson(value)).digest("hex");

export const toInputJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;

export const toRawInputJson = (value: unknown): Prisma.InputJsonValue => {
  const serialized = JSON.stringify(value ?? null);

  if (serialized.includes("\\u0000") || serialized.includes("\0")) {
    return {
      data: Buffer.from(serialized, "utf8").toString("base64"),
      encoding: "json-utf8-base64",
    };
  }

  return JSON.parse(serialized) as Prisma.InputJsonValue;
};
