export const WEBHOOK_MAX_PAYLOAD_BYTES = 1024 * 1024;

const DECIMAL_INTEGER_PATTERN = /^\d+$/;

export class WebhookPayloadTooLargeError extends Error {}
export class WebhookPayloadInvalidError extends Error {}

export const readBoundedWebhookBody = async (
  request: Request,
  limit = WEBHOOK_MAX_PAYLOAD_BYTES
): Promise<string> => {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && DECIMAL_INTEGER_PATTERN.test(declaredLength)) {
    const parsedLength = Number(declaredLength);
    if (Number.isSafeInteger(parsedLength) && parsedLength > limit) {
      throw new WebhookPayloadTooLargeError();
    }
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    byteLength += value.byteLength;
    if (byteLength > limit) {
      try {
        await reader.cancel();
      } catch {
        // The bounded read has already failed; cancellation is best effort.
      }
      throw new WebhookPayloadTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new WebhookPayloadInvalidError();
  }
};
