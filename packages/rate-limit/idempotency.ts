import "server-only";
import { randomUUID } from "node:crypto";
import type { Redis } from "@upstash/redis";
import { getRedis } from "./index";

const completedPrefix = "completed:";
const processingPrefix = "processing:";
const processingTtlSeconds = 10 * 60;
const completedTtlSeconds = 35 * 24 * 60 * 60;
const sha256HexPattern = /^[a-f0-9]{64}$/;

const completeScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("SET", KEYS[1], ARGV[2], "EX", ARGV[3])
end
return nil
`;

const releaseScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export type IdempotencyClaim =
  | { status: "completed" }
  | { status: "conflict" }
  | { status: "in_progress" }
  | {
      key: string;
      payloadHash: string;
      processingValue: string;
      status: "acquired";
    };

export interface IdempotencyBackend {
  compareAndComplete: (
    key: string,
    processingValue: string,
    completedValue: string,
    ttlSeconds: number
  ) => Promise<boolean>;
  compareAndDelete: (key: string, processingValue: string) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  setIfAbsent: (
    key: string,
    value: string,
    ttlSeconds: number
  ) => Promise<boolean>;
}

export class IdempotencyStore {
  readonly #backend: IdempotencyBackend;

  constructor(backend: IdempotencyBackend) {
    this.#backend = backend;
  }

  async begin(
    scope: string,
    eventId: string,
    payloadHash: string
  ): Promise<IdempotencyClaim> {
    if (!sha256HexPattern.test(payloadHash)) {
      throw new Error("Webhook idempotency payload hash is invalid");
    }
    const key = `automarket:idempotency:${scope}:${eventId}`;
    const processingValue = `${processingPrefix}${payloadHash}:${randomUUID()}`;
    const acquired = await this.#backend.setIfAbsent(
      key,
      processingValue,
      processingTtlSeconds
    );

    if (acquired) {
      return { key, payloadHash, processingValue, status: "acquired" };
    }

    const value = await this.#backend.get(key);

    let storedHash: string | null = null;
    if (value?.startsWith(completedPrefix)) {
      storedHash = value.slice(completedPrefix.length);
    } else if (value?.startsWith(processingPrefix)) {
      storedHash =
        value.slice(processingPrefix.length).split(":", 1)[0] ?? null;
    }
    if (storedHash !== payloadHash) {
      return { status: "conflict" };
    }
    return value?.startsWith(completedPrefix)
      ? { status: "completed" }
      : { status: "in_progress" };
  }

  async complete(
    claim: Extract<IdempotencyClaim, { status: "acquired" }>
  ): Promise<void> {
    const completed = await this.#backend.compareAndComplete(
      claim.key,
      claim.processingValue,
      `${completedPrefix}${claim.payloadHash}`,
      completedTtlSeconds
    );

    if (!completed) {
      throw new Error("Webhook idempotency claim was lost before completion");
    }
  }

  async release(
    claim: Extract<IdempotencyClaim, { status: "acquired" }>
  ): Promise<void> {
    await this.#backend.compareAndDelete(claim.key, claim.processingValue);
  }
}

const createRedisBackend = (client: Redis): IdempotencyBackend => ({
  compareAndComplete: async (
    key,
    processingValue,
    completedValue,
    ttlSeconds
  ) => {
    const result = await client.eval<[string, string, number], string | null>(
      completeScript,
      [key],
      [processingValue, completedValue, ttlSeconds]
    );

    return result === "OK";
  },
  compareAndDelete: async (key, processingValue) => {
    await client.eval<[string], number>(
      releaseScript,
      [key],
      [processingValue]
    );
  },
  get: (key) => client.get<string>(key),
  setIfAbsent: async (key, value, ttlSeconds) => {
    const result = await client.set(key, value, {
      ex: ttlSeconds,
      nx: true,
    });

    return result === "OK";
  },
});

let store: IdempotencyStore | undefined;

export const getIdempotencyStore = (): IdempotencyStore => {
  store ??= new IdempotencyStore(createRedisBackend(getRedis()));

  return store;
};
