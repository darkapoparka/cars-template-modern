import type { Locale } from "@repo/internationalization/config";
import {
  safePreferenceDestination,
  withBasePath,
} from "@repo/internationalization/paths";

/** Preference-only request. A late response still needs the caller's intent/version check. */
export async function postPreferences(
  action: "save" | "dismiss",
  locale: Locale,
  country: string,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch(withBasePath("/api/preferences"), {
    method: "POST",
    credentials: "same-origin",
    signal,
    keepalive: action === "dismiss",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      locale,
      country,
      returnTo:
        window.location.pathname +
        window.location.search +
        window.location.hash,
    }),
  });
  if (!response.ok) {
    throw new Error("preference_request_failed");
  }
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("destination" in result)) {
    throw new Error("invalid_preference_response");
  }
  const destination = safePreferenceDestination(
    result.destination,
    window.location.origin
  );
  if (!destination) {
    throw new Error("invalid_preference_destination");
  }
  return destination;
}
export function rememberPrompt(key: string): void {
  try {
    localStorage.setItem(key, "dismissed");
  } catch {
    /* Storage is optional; URLs still select the language. */
  }
}
