import { withVercelToolbar } from "@vercel/toolbar/plugins/next";
import { keys } from "../keys";

export const withToolbar = (config: object) => {
  if (
    process.env.NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E === "true" ||
    !keys().FLAGS_SECRET
  ) {
    return config;
  }

  return withVercelToolbar()(config);
};
