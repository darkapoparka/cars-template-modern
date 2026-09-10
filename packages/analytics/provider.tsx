"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type AnalyticsConsent,
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "./consent";
import { getAnalyticsConsentCopy } from "./consent-copy";
import { initializeAnalytics } from "./instrumentation-client";
import { keys } from "./keys";
import styles from "./provider.module.css";

interface AnalyticsProviderProps {
  readonly children: ReactNode;
  readonly locale?: string;
  readonly privacyHref?: string;
  readonly showConsentBanner?: boolean;
  readonly vercelAnalyticsEnabled?: boolean;
}

const { NEXT_PUBLIC_GA_MEASUREMENT_ID } = keys();
const getServerAnalyticsConsent = (): AnalyticsConsent => "unknown";

export const AnalyticsProvider = ({
  children,
  locale,
  privacyHref = "/legal/privacy",
  showConsentBanner = true,
  vercelAnalyticsEnabled = false,
}: AnalyticsProviderProps) => {
  const [hydrated, setHydrated] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    getServerAnalyticsConsent
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    initializeAnalytics(consent);
  }, [consent]);

  const copy = getAnalyticsConsentCopy(locale);
  const chooseConsent = (decision: "denied" | "granted") => {
    setAnalyticsConsent(decision);
    setPreferencesOpen(false);
  };
  const consentPanel = (
    <aside
      aria-busy={!hydrated}
      aria-label={copy.ariaLabel}
      className={`${styles.consentPanel} rounded-xl border border-border/70 bg-card p-3 text-foreground shadow-lg`}
      data-hydrated={hydrated ? "true" : "false"}
      data-testid="analytics-consent"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm">{copy.title}</p>
            {consent !== "unknown" && (
              <button
                className="min-h-10 rounded-md px-2 text-muted-foreground text-xs hover:bg-control hover:text-foreground"
                onClick={() => setPreferencesOpen(false)}
                type="button"
              >
                {copy.close}
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-4">
            {copy.description}{" "}
            <a className="underline underline-offset-2" href={privacyHref}>
              {copy.privacy}
            </a>
            .
          </p>
          {consent !== "unknown" && (
            <p className="mt-1 text-[11px] text-muted-foreground leading-4">
              {consent === "granted" ? copy.statusGranted : copy.statusDenied}
            </p>
          )}
        </div>
        <div className="grid shrink-0 gap-1.5">
          <button
            className="min-h-10 rounded-md border border-border/70 px-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hydrated}
            onClick={() => chooseConsent("denied")}
            type="button"
          >
            {copy.decline}
          </button>
          <button
            className="min-h-10 rounded-md bg-foreground px-2.5 text-background text-xs disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hydrated}
            onClick={() => chooseConsent("granted")}
            type="button"
          >
            {copy.accept}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {showConsentBanner && consent === "unknown" && (
        <div className={styles.consentRegion}>{consentPanel}</div>
      )}
      {children}
      {consent === "granted" && (
        <>
          {vercelAnalyticsEnabled && <VercelAnalytics />}
          {NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics gaId={NEXT_PUBLIC_GA_MEASUREMENT_ID} />
          )}
        </>
      )}
      {showConsentBanner && consent !== "unknown" && (
        <div className={styles.preferencesRegion}>
          {preferencesOpen ? (
            consentPanel
          ) : (
            <button
              className={`${styles.preferencesButton} min-h-10 rounded-full border border-border/70 bg-card px-3 font-medium text-foreground text-xs shadow-sm`}
              data-testid="analytics-preferences"
              onClick={() => setPreferencesOpen(true)}
              type="button"
            >
              {copy.manage}
            </button>
          )}
        </div>
      )}
    </>
  );
};
