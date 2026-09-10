import { getDealerFeedBySlug } from "@repo/database/dealer-studio";
import { env } from "@/env";
import { serviceJson } from "@/lib/service-auth";

interface DealerFeedRouteContext {
  params: Promise<{ slug: string[] }> | { slug: string[] };
}

const DEALER_FEED_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/;

const resolveRouteParams = (params: DealerFeedRouteContext["params"]) =>
  Promise.resolve(params);

const normalizeFeedSlug = (segments: string[]) => {
  if (segments.length !== 1) {
    return null;
  }

  const slug = segments[0].endsWith(".json")
    ? segments[0].slice(0, -".json".length)
    : segments[0];
  return DEALER_FEED_SLUG_PATTERN.test(slug) ? slug : null;
};

export const GET = async (
  _request: Request,
  context: DealerFeedRouteContext
): Promise<Response> => {
  const { slug: segments } = await resolveRouteParams(context.params);
  const slug = normalizeFeedSlug(segments);

  if (!slug) {
    return serviceJson(
      {
        error: "dealer_feed_not_found",
        message: "Dealer feed was not found or is not enabled.",
      },
      404
    );
  }

  const webBaseUrl = new URL(env.NEXT_PUBLIC_WEB_URL).origin;

  const feed = await getDealerFeedBySlug(slug, { webBaseUrl });

  if (!feed) {
    return serviceJson(
      {
        error: "dealer_feed_not_found",
        message: "Dealer feed was not found or is not enabled.",
      },
      404
    );
  }

  return Response.json(feed, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
};
