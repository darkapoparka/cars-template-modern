"use client";

import { isLocale, type Locale } from "@repo/internationalization/config";
import { containDialogTab } from "@repo/internationalization/focus";
import {
  isCountry,
  type ResolvedLocale,
} from "@repo/internationalization/policy";
import type { PreferenceMessages } from "@repo/internationalization/preferences-messages";
import {
  postPreferences,
  rememberPrompt,
} from "../lib/locale-preference-request";
import {
  isPreferenceField,
  nativeValidationMessage,
} from "../lib/locale-validation";

type LocaleState = ResolvedLocale<Locale>;

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const PreferenceContext = createContext<{
  state: LocaleState;
  open: () => void;
  returnTo: string;
} | null>(null);
export const useLocalePreferences = () => useContext(PreferenceContext);

/** Native dialog supplies modal focus containment; no mutable server visitor state. */
export function LocalePreferencesProvider({
  children,
  state,
  returnTo,
  countryOptions,
  messages,
  dealerName,
  dealerCountry,
  inventoryCurrency,
  enabledLocales,
  promptVersion,
}: {
  children: ReactNode;
  state: LocaleState;
  returnTo: string;
  countryOptions: readonly { code: string; name: string }[];
  messages: PreferenceMessages;
  dealerName: string;
  dealerCountry: string;
  inventoryCurrency: string;
  enabledLocales: readonly Locale[];
  promptVersion: string;
}) {
  const promptKey = `cars.prompt.${promptVersion}`;
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const attempted = useRef(false);
  const requestVersion = useRef(0);
  const pendingRequest = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>(state.locale);
  const [country, setCountry] = useState(state.country);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const t = (
    key: keyof PreferenceMessages,
    parameters: Record<string, string | number> = {}
  ) =>
    messages[key].replace(
      /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g,
      (placeholder, name: string) =>
        Object.hasOwn(parameters, name) ? String(parameters[name]) : placeholder
    );
  const invalidateRequest = useCallback(() => {
    requestVersion.current += 1;
    pendingRequest.current?.abort();
    pendingRequest.current = null;
    setBusy(false);
  }, []);
  useEffect(
    () => () => {
      // Unmounting must invalidate late responses as well as cancel their work.
      requestVersion.current += 1;
      pendingRequest.current?.abort();
      pendingRequest.current = null;
    },
    []
  );
  // Names and sort order come from SSR, avoiding browser/server ICU differences.
  const options = countryOptions;
  const show = useCallback(
    (manualSelection = true) => {
      invalidateRequest();
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setManual(manualSelection);
      setLocale(state.locale);
      setCountry(state.country);
      setError(false);
      setOpen(true);
    },
    [state.locale, state.country, invalidateRequest]
  );

  useEffect(() => {
    setReady(true);
    if (attempted.current) {
      return;
    }
    attempted.current = true;
    if (window.location.pathname.endsWith("/locale-settings")) {
      return;
    }
    let dismissed = state.promptDismissed;
    try {
      dismissed ||= localStorage.getItem(promptKey) === "dismissed";
    } catch {
      /* Storage is optional. */
    }
    if (!dismissed) {
      show(false);
    }
  }, [state.promptDismissed, show, promptKey]);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) {
      element.showModal();
    }
    if (!open && element?.open) {
      element.close();
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    const target = returnFocus.current;
    requestAnimationFrame(() => {
      if (dialog.current?.open) {
        return;
      }
      const candidates = [
        target,
        ...document.querySelectorAll<HTMLElement>(
          '[data-slot="dealer-bottom-nav"] button[aria-haspopup="dialog"], [data-locale-trigger]'
        ),
      ];
      candidates
        .find(
          (element) =>
            element &&
            element !== document.body &&
            element.isConnected &&
            element.getClientRects().length
        )
        ?.focus({ preventScroll: true });
    });
  };
  const persist = async (action: "save" | "dismiss") => {
    if (busy && action === "save") {
      return;
    }
    invalidateRequest();
    const version = requestVersion.current;
    if (action === "dismiss") {
      // Only an explicit dismissal is mirrored; storage never decides language.
      rememberPrompt(promptKey);
      close();
    }
    setBusy(true);
    setError(false);
    const controller = new AbortController();
    pendingRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const destination = await postPreferences(
        action,
        locale,
        country,
        controller.signal
      );
      if (action === "save" && version === requestVersion.current) {
        rememberPrompt(promptKey);
        window.location.assign(destination);
      }
    } catch {
      if (action === "save" && version === requestVersion.current) {
        setError(true);
      }
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion.current) {
        pendingRequest.current = null;
        setBusy(false);
      }
    }
  };

  return (
    <PreferenceContext.Provider value={{ state, open: show, returnTo }}>
      <div
        className="contents"
        onChangeCapture={(event) => {
          const field = event.target;
          if (
            field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement
          ) {
            field.setCustomValidity("");
          }
        }}
        onInputCapture={(event) => {
          const field = event.target;
          if (
            field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement
          ) {
            field.setCustomValidity("");
          }
        }}
        onInvalidCapture={(event) => {
          const field = event.target;
          if (isPreferenceField(field) && !field.validity.customError) {
            field.setCustomValidity(nativeValidationMessage(field, t));
          }
        }}
      >
        {children}
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: Native modal dialog owns Escape and keyboard focus containment. */}
      <dialog
        aria-describedby="locale-preferences-description"
        aria-labelledby="locale-preferences-title"
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[90dvh] w-full max-w-full overflow-y-auto rounded-t-2xl border-0 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-zinc-950 shadow-2xl backdrop:bg-black/50 sm:inset-0 sm:m-auto sm:h-fit sm:w-[28rem] sm:rounded-2xl"
        data-locale-dialog
        data-locale-ready={ready}
        data-preference-country={state.country}
        data-prompt-dismissed={state.promptDismissed}
        data-suggested-country={state.suggestedCountry}
        onCancel={(event) => {
          event.preventDefault();
          persist("dismiss");
        }}
        onKeyDown={(event) =>
          containDialogTab(event.nativeEvent, event.currentTarget)
        }
        ref={dialog}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-xl" id="locale-preferences-title">
            {t(manual ? "locale.title" : "locale.welcome", {
              dealer: dealerName,
            })}
          </h2>
          <button
            aria-label={t("locale.close")}
            className="min-h-11 min-w-11 rounded-lg border border-zinc-300 text-xl"
            onClick={() => persist("dismiss")}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="mt-3 text-sm" id="locale-preferences-description">
          {t("locale.description")}
        </p>
        <p className="mt-3 font-medium">
          {t("locale.suggestion", {
            country:
              options.find((option) => option.code === state.suggestedCountry)
                ?.name ?? state.suggestedCountry,
          })}
        </p>
        {manual ? null : (
          <button
            className="min-h-11 rounded-lg px-3 underline"
            onClick={() => document.getElementById("locale-country")?.focus()}
            type="button"
          >
            {t("locale.trigger")}
          </button>
        )}
        <form
          aria-busy={busy}
          className="mt-4 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            persist("save");
          }}
        >
          <label className="grid gap-2" htmlFor="locale-country">
            {t("locale.country")}
            <select
              className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-400 bg-white px-3"
              id="locale-country"
              name="country"
              onChange={(event) => {
                if (isCountry(event.target.value)) {
                  setCountry(event.target.value);
                }
              }}
              value={country}
            >
              {options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                  {option.code === state.suggestedCountry
                    ? ` — ${t("locale.suggested")}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2" htmlFor="locale-language">
            {t("locale.language")}
            <select
              className="min-h-11 w-full rounded-lg border border-zinc-400 bg-white px-3"
              id="locale-language"
              name="locale"
              onChange={(event) => {
                if (
                  isLocale(event.target.value) &&
                  enabledLocales.includes(event.target.value)
                ) {
                  setLocale(event.target.value);
                }
              }}
              value={locale}
            >
              {enabledLocales.map((value) => (
                <option key={value} lang={value} value={value}>
                  {value === "bg" ? "Български" : "English"}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-zinc-600">
            {t("locale.facts", {
              country: dealerCountry,
              currency: inventoryCurrency,
            })}
          </p>
          {error ? (
            <p className="text-red-700 text-sm" role="alert">
              {t("locale.error")}
            </p>
          ) : null}
          <button
            className="min-h-11 rounded-lg bg-zinc-950 px-4 py-3 font-medium text-white"
            disabled={busy}
            type="submit"
          >
            {t(busy ? "locale.saving" : "locale.save")}
          </button>
          <button
            className="min-h-11 rounded-lg border border-zinc-400 px-4 py-3"
            onClick={() => persist("dismiss")}
            type="button"
          >
            {t("locale.dismiss")}
          </button>
        </form>
      </dialog>
    </PreferenceContext.Provider>
  );
}
