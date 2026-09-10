import "server-only";
import { Liveblocks as LiveblocksNode } from "@liveblocks/node";
import { keys } from "./keys";

interface AuthenticateOptions {
  orgId: string;
  userId: string;
  userInfo: Liveblocks["UserMeta"]["info"];
}

export const authenticate = async ({
  userId,
  orgId,
  userInfo,
}: AuthenticateOptions) => {
  const secret = keys().LIVEBLOCKS_SECRET;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET is not set");
  }

  const liveblocks = new LiveblocksNode({ secret });

  // Start an auth session inside your endpoint
  const session = liveblocks.prepareSession(userId, { userInfo });

  // Use a naming pattern to allow access to rooms with wildcards
  // Giving the user write access on their organization
  session.allow(`${orgId}:*`, session.FULL_ACCESS);

  // Authorize the user and return the result
  const { status, body } = await session.authorize();

  return new Response(body, {
    headers: { "cache-control": "no-store" },
    status,
  });
};
