import { VercelToolbar } from "@vercel/toolbar/next";
import { keys } from "../keys";

export const Toolbar = () => {
  if (
    process.env.NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E === "true" ||
    !keys().FLAGS_SECRET
  ) {
    return null;
  }

  return <VercelToolbar />;
};
