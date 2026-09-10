import "server-only";
import { type CreateEmailOptions, type ErrorResponse, Resend } from "resend";
import {
  type EmailDeliveryProvider,
  EmailProviderError,
  ReliableEmailDelivery,
} from "./delivery";
import { keys } from "./keys";

export * from "./delivery";

let client: Resend | undefined;

export const getResend = (): Resend | undefined => {
  const { RESEND_TOKEN } = keys();
  if (!RESEND_TOKEN) {
    return;
  }

  client ??= new Resend(RESEND_TOKEN);
  return client;
};

const transientProviderCodes = new Set<ErrorResponse["name"]>([
  "application_error",
  "concurrent_idempotent_requests",
  "internal_server_error",
  "rate_limit_exceeded",
]);

const createProviderError = (error: ErrorResponse) =>
  new EmailProviderError({
    code: error.name,
    retryable:
      transientProviderCodes.has(error.name) ||
      error.statusCode === 408 ||
      error.statusCode === 429 ||
      Boolean(error.statusCode && error.statusCode >= 500),
    statusCode: error.statusCode ?? undefined,
  });

export const createResendEmailProvider = (
  getClient: () => Resend | undefined = getResend
): EmailDeliveryProvider => ({
  name: "resend",
  send: async (payload: CreateEmailOptions, { idempotencyKey }) => {
    const resend = getClient();
    if (!resend) {
      throw new EmailProviderError({
        code: "provider_not_configured",
        retryable: false,
      });
    }

    const result = await resend.emails.send(payload, { idempotencyKey });
    if (result.error) {
      throw createProviderError(result.error);
    }

    return { providerMessageId: result.data.id };
  },
});

let delivery: ReliableEmailDelivery | undefined;

export const getReliableEmailDelivery = (): ReliableEmailDelivery => {
  delivery ??= new ReliableEmailDelivery({
    provider: createResendEmailProvider(),
  });
  return delivery;
};
