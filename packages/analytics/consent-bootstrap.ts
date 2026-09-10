import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_VERSION,
} from "./consent";

export const analyticsConsentBootstrapScript = `
try {
  const privacyRequested = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  const rawConsent = window.localStorage.getItem(${JSON.stringify(ANALYTICS_CONSENT_STORAGE_KEY)});
  const storedConsent = rawConsent ? JSON.parse(rawConsent) : null;
  const storedDecisionIsCurrent = storedConsent?.version === ${ANALYTICS_CONSENT_VERSION}
    && (storedConsent?.decision === "denied" || storedConsent?.decision === "granted")
    && typeof storedConsent?.updatedAt === "string"
    && Number.isFinite(Date.parse(storedConsent.updatedAt));

  if (privacyRequested || storedDecisionIsCurrent) {
    document.documentElement.dataset.analyticsConsentResolved = "true";
  }
} catch {}
`;
