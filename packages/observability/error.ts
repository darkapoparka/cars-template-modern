// biome-ignore lint/performance/noNamespaceImport: Sentry SDK convention
import * as Sentry from "@sentry/nextjs";
import { log } from "./log";
import { redactText } from "./redaction";

export const parseError = (error: unknown): string => {
  let message = "An error occurred";

  if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String(error.message);
  } else {
    message = String(error);
  }

  message = redactText(message);

  try {
    Sentry.captureException(error, {
      extra: {
        originalErrorName: error instanceof Error ? error.name : "UnknownError",
      },
    });
    log.error("Application error captured", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      message,
    });
  } catch {
    log.error("Application error reporting failed");
  }

  return message;
};
