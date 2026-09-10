import type { Metadata } from "next";

export const appIndexingMetadata = {
  robots: {
    follow: false,
    index: false,
  },
} satisfies Pick<Metadata, "robots">;
