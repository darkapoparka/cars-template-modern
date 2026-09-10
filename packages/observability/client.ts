/*
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a users loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

// biome-ignore lint/performance/noNamespaceImport: Sentry SDK convention
import * as Sentry from "@sentry/nextjs";
import { keys } from "./keys";
import { sanitizeTelemetryEvent } from "./redaction";

export const initializeSentry = (): ReturnType<typeof Sentry.init> =>
  Sentry.init({
    dsn: keys().NEXT_PUBLIC_SENTRY_DSN,

    // Browser console collection and session replay remain disabled. Base error
    // reporting is retained with client-side redaction and no default PII.
    beforeSend: (event) => sanitizeTelemetryEvent(event),
    enableLogs: false,

    // Performance tracing is not required for the base crash-reporting contract.
    tracesSampleRate: 0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    sendDefaultPii: false,
  });

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
