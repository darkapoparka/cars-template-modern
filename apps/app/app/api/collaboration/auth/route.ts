import { auth, currentUser } from "@repo/auth/server";
import { authenticate } from "@repo/collaboration/auth";
import { requireOrganizationActor } from "@repo/database/organization-access";
import { NextResponse } from "next/server";

const jsonFailure = (error: string, status: 401 | 403) =>
  NextResponse.json(
    { error },
    { headers: { "cache-control": "no-store" }, status }
  );

const COLORS = [
  "var(--color-red-500)",
  "var(--color-orange-500)",
  "var(--color-amber-500)",
  "var(--color-yellow-500)",
  "var(--color-lime-500)",
  "var(--color-green-500)",
  "var(--color-emerald-500)",
  "var(--color-teal-500)",
  "var(--color-cyan-500)",
  "var(--color-sky-500)",
  "var(--color-blue-500)",
  "var(--color-indigo-500)",
  "var(--color-violet-500)",
  "var(--color-purple-500)",
  "var(--color-fuchsia-500)",
  "var(--color-pink-500)",
  "var(--color-rose-500)",
];

export const POST = async () => {
  const { orgId, userId } = await auth();

  if (!userId) {
    return jsonFailure("Authentication required", 401);
  }

  if (!orgId) {
    return jsonFailure("Active organization required", 403);
  }

  const user = await currentUser();

  if (!user) {
    return jsonFailure("Authentication required", 401);
  }

  try {
    await requireOrganizationActor({
      clerkOrgId: orgId,
      clerkUserId: user.id,
    });
  } catch {
    return jsonFailure("Organization access denied", 403);
  }

  try {
    const response = await authenticate({
      userId: user.id,
      orgId,
      userInfo: {
        name:
          user.fullName ?? user.emailAddresses.at(0)?.emailAddress ?? undefined,
        avatar: user.imageUrl ?? undefined,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      },
    });
    response.headers.set("cache-control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Collaboration service unavailable" },
      { headers: { "cache-control": "no-store" }, status: 503 }
    );
  }
};
