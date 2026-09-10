import { env } from "@/env";

export type DealerCommerceCapability = Readonly<{
  checkoutAvailable: boolean;
  mode:
    | "disabled"
    | "launch_enabled"
    | "misconfigured"
    | "provider_unavailable";
  surfaceAvailable: true;
}>;

export const getDealerCommerceCapability = (
  intent: string | undefined,
  projectionAvailable = false
): DealerCommerceCapability => {
  if (intent === undefined) {
    return {
      checkoutAvailable: false,
      mode: "misconfigured",
      surfaceAvailable: true,
    };
  }

  if (intent !== "true") {
    return {
      checkoutAvailable: false,
      mode: "disabled",
      surfaceAvailable: true,
    };
  }

  if (!projectionAvailable) {
    return {
      checkoutAvailable: false,
      mode: "provider_unavailable",
      surfaceAvailable: true,
    };
  }

  return {
    checkoutAvailable: true,
    mode: "launch_enabled",
    surfaceAvailable: true,
  };
};

export const dealerCommerceCapability = getDealerCommerceCapability(
  env.AUTOMARKET_ENABLE_BILLING,
  false
);
