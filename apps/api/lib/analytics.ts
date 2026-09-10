import { analytics } from "@repo/analytics/server";
import { log } from "@repo/observability/log";

export const flushAnalyticsBestEffort = (): void => {
  if (!analytics) {
    return;
  }

  try {
    const pendingFlush = analytics.shutdown();
    if (pendingFlush) {
      pendingFlush.catch(() => {
        log.warn("Optional analytics flush failed", { provider: "posthog" });
      });
    }
  } catch {
    log.warn("Optional analytics flush failed", { provider: "posthog" });
  }
};
