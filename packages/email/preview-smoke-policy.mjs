const singleEmailPattern = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const displayAddressPattern = /<([^<>]+)>$/;

const getAddress = (value) => {
  const match = value.match(displayAddressPattern);
  return (match?.[1] ?? value).trim();
};

export const getPreviewSmokeConfiguration = (environment) => {
  if (environment.AUTOMARKET_DELIVERY_SMOKE_TARGET !== "preview") {
    throw new Error("Smoke target must be explicitly set to preview");
  }
  if (
    environment.VERCEL_ENV === "production" ||
    environment.AUTOMARKET_DEPLOYMENT_TARGET === "production"
  ) {
    throw new Error("Production delivery smoke targets are refused");
  }
  if (
    environment.AUTOMARKET_PREVIEW_SMOKE_CONFIRM !==
    "send-disposable-preview-email"
  ) {
    throw new Error("Disposable Preview send confirmation is missing");
  }

  const token = environment.RESEND_TOKEN?.trim();
  const from = environment.RESEND_FROM?.trim();
  const recipient = environment.AUTOMARKET_PREVIEW_SMOKE_RECIPIENT?.trim();

  if (!token?.startsWith("re_")) {
    throw new Error("A Resend Preview token is required");
  }
  if (!(from && singleEmailPattern.test(getAddress(from)))) {
    throw new Error("A valid Preview sender is required");
  }
  if (!(recipient && singleEmailPattern.test(recipient))) {
    throw new Error("One disposable Preview recipient is required");
  }

  return { from, recipient, token };
};

export const getPreviewSmokeDecision = (environment) => {
  if (
    environment.VERCEL_ENV === "production" ||
    environment.AUTOMARKET_DEPLOYMENT_TARGET === "production" ||
    environment.AUTOMARKET_DELIVERY_SMOKE_TARGET === "production"
  ) {
    throw new Error("Production delivery smoke targets are refused");
  }

  if (
    !(
      environment.RESEND_TOKEN?.trim() &&
      environment.RESEND_FROM?.trim() &&
      environment.AUTOMARKET_PREVIEW_SMOKE_RECIPIENT?.trim()
    )
  ) {
    return { reason: "preview_provider_values_absent", status: "skipped" };
  }

  return {
    configuration: getPreviewSmokeConfiguration(environment),
    status: "ready",
  };
};
