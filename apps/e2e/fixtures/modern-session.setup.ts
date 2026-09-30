import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { type FullConfig, request } from "@playwright/test";
import { publicSite } from "@repo/marketplace/site-config";

export const modernMobileStatePath = fileURLToPath(
  new URL("../../../runtime/modern-mobile-session.json", import.meta.url)
);

/** Ordinary journeys use a dismissed welcome; its first-visit flow has separate tests. */
export default async function setupModernSession(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) {
    throw new Error("Modern mobile checks require a preview base URL.");
  }
  const origin = new URL(baseURL).origin;
  const context = await request.newContext({ baseURL });
  try {
    const response = await context.post("/api/preferences", {
      headers: { origin },
      data: {
        action: "dismiss",
        locale: publicSite.market.defaultLocale,
        country: publicSite.market.countryCode,
        returnTo: "/cars",
      },
    });
    if (response.status() !== 200) {
      throw new Error(`Welcome dismissal returned ${response.status()}.`);
    }
    await mkdir(dirname(modernMobileStatePath), { recursive: true });
    await context.storageState({ path: modernMobileStatePath });
  } finally {
    await context.dispose();
  }
}
