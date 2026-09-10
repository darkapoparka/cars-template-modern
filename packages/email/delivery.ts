import type { CreateEmailOptions } from "resend";

export type EmailDeliveryState = "queued" | "sent" | "delivered" | "failed";

export interface EmailDeliveryProvider {
  readonly name: string;
  send: (
    payload: CreateEmailOptions,
    context: { readonly idempotencyKey: string }
  ) => Promise<{ readonly providerMessageId: string }>;
}

export interface EmailDeliveryRequest {
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly payload: CreateEmailOptions;
}

export interface EmailDeliveryReceipt {
  readonly attempts: number;
  readonly correlationId: string;
  readonly provider: string;
  readonly providerMessageId: string;
  readonly sentAt: Date;
  readonly state: "sent";
}

export type EmailDeliveryFailureCode =
  | "circuit_open"
  | "provider_permanent"
  | "provider_timeout"
  | "provider_unavailable";

export class EmailProviderError extends Error {
  readonly code?: string;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor({
    code,
    retryable,
    statusCode,
  }: {
    readonly code?: string;
    readonly retryable: boolean;
    readonly statusCode?: number;
  }) {
    super("Email provider rejected the request");
    this.name = "EmailProviderError";
    this.code = code;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}

export class EmailDeliveryFailure extends Error {
  readonly attempts: number;
  readonly code: EmailDeliveryFailureCode;
  readonly retryable: boolean;
  readonly state = "failed" as const;

  constructor({
    attempts,
    code,
    retryable,
  }: {
    readonly attempts: number;
    readonly code: EmailDeliveryFailureCode;
    readonly retryable: boolean;
  }) {
    super(`Email delivery failed: ${code}`);
    this.name = "EmailDeliveryFailure";
    this.attempts = attempts;
    this.code = code;
    this.retryable = retryable;
  }
}

interface ReliableEmailDeliveryOptions {
  readonly circuitFailureThreshold?: number;
  readonly circuitOpenMs?: number;
  readonly maxAttempts?: number;
  readonly now?: () => number;
  readonly provider: EmailDeliveryProvider;
  readonly retryBaseMs?: number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly timeoutMs?: number;
}

const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,255}$/;

const defaultSleep = async (milliseconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error && error.name === "EmailProviderTimeoutError";

const toFailure = (error: unknown, attempts: number): EmailDeliveryFailure => {
  if (isTimeoutError(error)) {
    return new EmailDeliveryFailure({
      attempts,
      code: "provider_timeout",
      retryable: true,
    });
  }

  if (error instanceof EmailProviderError) {
    return new EmailDeliveryFailure({
      attempts,
      code: error.retryable ? "provider_unavailable" : "provider_permanent",
      retryable: error.retryable,
    });
  }

  return new EmailDeliveryFailure({
    attempts,
    code: "provider_unavailable",
    retryable: true,
  });
};

export class ReliableEmailDelivery {
  readonly #circuitFailureThreshold: number;
  readonly #circuitOpenMs: number;
  readonly #maxAttempts: number;
  readonly #now: () => number;
  readonly #provider: EmailDeliveryProvider;
  readonly #retryBaseMs: number;
  readonly #sleep: (milliseconds: number) => Promise<void>;
  readonly #timeoutMs: number;
  #consecutiveFailures = 0;
  #openUntil = 0;

  constructor(options: ReliableEmailDeliveryOptions) {
    this.#provider = options.provider;
    this.#maxAttempts = options.maxAttempts ?? 3;
    this.#timeoutMs = options.timeoutMs ?? 3000;
    this.#retryBaseMs = options.retryBaseMs ?? 150;
    this.#circuitFailureThreshold = options.circuitFailureThreshold ?? 3;
    this.#circuitOpenMs = options.circuitOpenMs ?? 30_000;
    this.#sleep = options.sleep ?? defaultSleep;
    this.#now = options.now ?? Date.now;

    if (
      this.#maxAttempts < 1 ||
      this.#timeoutMs < 1 ||
      this.#circuitFailureThreshold < 1
    ) {
      throw new Error("Email delivery retry configuration is invalid");
    }
  }

  async deliver(request: EmailDeliveryRequest): Promise<EmailDeliveryReceipt> {
    if (!idempotencyKeyPattern.test(request.idempotencyKey)) {
      throw new EmailDeliveryFailure({
        attempts: 0,
        code: "provider_permanent",
        retryable: false,
      });
    }

    const now = this.#now();
    if (this.#openUntil > now) {
      throw new EmailDeliveryFailure({
        attempts: 0,
        code: "circuit_open",
        retryable: true,
      });
    }

    let lastFailure: EmailDeliveryFailure | undefined;

    for (let attempt = 1; attempt <= this.#maxAttempts; attempt += 1) {
      try {
        const result = await this.#withTimeout(
          this.#provider.send(request.payload, {
            idempotencyKey: request.idempotencyKey,
          })
        );
        this.#consecutiveFailures = 0;
        this.#openUntil = 0;

        return {
          attempts: attempt,
          correlationId: request.correlationId,
          provider: this.#provider.name,
          providerMessageId: result.providerMessageId,
          sentAt: new Date(this.#now()),
          state: "sent",
        };
      } catch (error) {
        lastFailure = toFailure(error, attempt);
        if (!(lastFailure.retryable && attempt < this.#maxAttempts)) {
          break;
        }

        await this.#sleep(this.#retryBaseMs * 2 ** (attempt - 1));
      }
    }

    const failure =
      lastFailure ??
      new EmailDeliveryFailure({
        attempts: 0,
        code: "provider_unavailable",
        retryable: true,
      });
    if (failure.retryable) {
      this.#consecutiveFailures += 1;
      if (this.#consecutiveFailures >= this.#circuitFailureThreshold) {
        this.#openUntil = this.#now() + this.#circuitOpenMs;
      }
    }
    throw failure;
  }

  async #withTimeout<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error("Email provider request timed out");
        error.name = "EmailProviderTimeoutError";
        reject(error);
      }, this.#timeoutMs);
    });

    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}
