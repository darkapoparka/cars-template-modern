import { hasAdminRole } from "@repo/auth/authorization";
import { auth } from "@repo/auth/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

interface AdminLayoutProperties {
  readonly children: ReactNode;
}

const AdminLayout = async ({ children }: AdminLayoutProperties) => {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (!hasAdminRole(sessionClaims)) {
    notFound();
  }

  return children;
};

export default AdminLayout;
