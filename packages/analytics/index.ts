export { posthog as analytics } from "posthog-js";
export {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_VERSION,
  type AnalyticsConsent,
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "./consent";
export { analyticsConsentBootstrapScript } from "./consent-bootstrap";
