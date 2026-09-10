export const ANALYTICS_CONSENT_STORAGE_KEY = "automarket.analytics-consent";
export const ANALYTICS_CONSENT_EVENT = "automarket:analytics-consent";
export const ANALYTICS_CONSENT_VERSION = 1;

export type AnalyticsConsent = "denied" | "granted" | "unknown";
type AnalyticsConsentDecision = Exclude<AnalyticsConsent, "unknown">;

interface StoredAnalyticsConsent {
  readonly decision: AnalyticsConsentDecision;
  readonly updatedAt: string;
  readonly version: typeof ANALYTICS_CONSENT_VERSION;
}

let volatileConsent: AnalyticsConsent = "unknown";

const parseConsent = (value: string | null): AnalyticsConsent => {
  if (!value) {
    return "unknown";
  }

  try {
    const record = JSON.parse(value) as Partial<StoredAnalyticsConsent>;
    const hasValidDecision =
      record.decision === "granted" || record.decision === "denied";

    return record.version === ANALYTICS_CONSENT_VERSION &&
      hasValidDecision &&
      typeof record.updatedAt === "string" &&
      Number.isFinite(Date.parse(record.updatedAt))
      ? record.decision
      : "unknown";
  } catch {
    return "unknown";
  }
};

const browserRequestsPrivacy = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const privacyNavigator = navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };

  return (
    privacyNavigator.globalPrivacyControl === true ||
    navigator.doNotTrack === "1"
  );
};

export const getAnalyticsConsent = (): AnalyticsConsent => {
  if (typeof window === "undefined") {
    return "unknown";
  }

  if (browserRequestsPrivacy()) {
    return "denied";
  }

  try {
    const storedConsent = parseConsent(
      window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)
    );
    return storedConsent === "unknown" ? volatileConsent : storedConsent;
  } catch {
    return volatileConsent;
  }
};

export const setAnalyticsConsent = (consent: AnalyticsConsentDecision) => {
  if (typeof window === "undefined") {
    return;
  }

  const record: StoredAnalyticsConsent = {
    decision: consent,
    updatedAt: new Date().toISOString(),
    version: ANALYTICS_CONSENT_VERSION,
  };
  volatileConsent = consent;

  try {
    window.localStorage.setItem(
      ANALYTICS_CONSENT_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    // The in-memory decision still applies for this page when storage is blocked.
  }

  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
};

export const subscribeToAnalyticsConsent = (onChange: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_STORAGE_KEY) {
      onChange();
    }
  };

  window.addEventListener(ANALYTICS_CONSENT_EVENT, onChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
};
