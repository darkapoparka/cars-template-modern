import "server-only";
import { PostHog } from "posthog-node";
import { keys } from "./keys";

const config = keys();
let client: PostHog | undefined;

const getAnalyticsClient = (): PostHog | undefined => {
  if (!(config.NEXT_PUBLIC_POSTHOG_KEY && config.NEXT_PUBLIC_POSTHOG_HOST)) {
    return undefined;
  }

  client ??= new PostHog(config.NEXT_PUBLIC_POSTHOG_KEY, {
    host: config.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });

  return client;
};

export const analytics =
  config.NEXT_PUBLIC_POSTHOG_KEY && config.NEXT_PUBLIC_POSTHOG_HOST
    ? {
        capture: (...arguments_: Parameters<PostHog["capture"]>) =>
          getAnalyticsClient()?.capture(...arguments_),
        groupIdentify: (...arguments_: Parameters<PostHog["groupIdentify"]>) =>
          getAnalyticsClient()?.groupIdentify(...arguments_),
        identify: (...arguments_: Parameters<PostHog["identify"]>) =>
          getAnalyticsClient()?.identify(...arguments_),
        isFeatureEnabled: (
          ...arguments_: Parameters<PostHog["isFeatureEnabled"]>
        ) => getAnalyticsClient()?.isFeatureEnabled(...arguments_),
        shutdown: () => getAnalyticsClient()?.shutdown(),
      }
    : undefined;
