const DECIMAL_INTEGER_PATTERN = /^\d+$/;

export class JsonPayloadTooLargeError extends Error {}

export const readBoundedJsonBody = async (
  request: Request,
  limit: number
): Promise<unknown> => {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && DECIMAL_INTEGER_PATTERN.test(declaredLength)) {
    const parsedLength = Number(declaredLength);
    if (Number.isSafeInteger(parsedLength) && parsedLength > limit) {
      throw new JsonPayloadTooLargeError();
    }
  }

  if (!request.body) {
    throw new SyntaxError("Request body is required");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    bytesRead += value.byteLength;
    if (bytesRead > limit) {
      try {
        await reader.cancel();
      } catch {
        // The bounded read has already failed; cancellation is best effort.
      }
      throw new JsonPayloadTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }

  return JSON.parse(text + decoder.decode());
};
