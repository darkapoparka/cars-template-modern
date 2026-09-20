import { isLocale } from "@repo/internationalization/config";
import { localizedPath, withBasePath } from "@repo/internationalization/paths";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRequestPreferences, localePolicy } from "@/lib/locale-preferences";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "bg" ? "Държава и език" : "Country and language",
    robots: { index: false, follow: false },
    // Native same-origin form POSTs need a non-null Origin. External referrers remain suppressed.
    referrer: "same-origin",
  };
}
/** Native HTML forms remain usable without JavaScript or browser storage. */
export default async function LocaleSettings({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const preferences = await getRequestPreferences(locale);
  const query = await searchParams;
  const candidate = localePolicy.safeReturnPath(
    query.returnTo,
    "https://locale.invalid"
  );
  const returnTo = candidate ?? withBasePath(localizedPath(locale, "/cars"));
  const { state, countryOptions, messages: t } = preferences;
  return (
    <main className="mx-auto max-w-xl px-5 py-12" data-locale-settings>
      <h1 className="font-semibold text-2xl">{t["locale.title"]}</h1>
      <p className="mt-4">{t["locale.description"]}</p>
      <form
        action={withBasePath("/api/preferences")}
        className="mt-6 grid gap-5"
        method="post"
      >
        <input name="returnTo" type="hidden" value={returnTo} />
        <label className="grid gap-2">
          {t["locale.country"]}
          <select
            className="min-h-11 w-full rounded-lg border bg-background p-2"
            defaultValue={state.country}
            name="country"
          >
            {countryOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
                {option.code === state.suggestedCountry
                  ? ` — ${t["locale.suggested"]}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          {t["locale.language"]}
          <select
            className="min-h-11 w-full rounded-lg border bg-background p-2"
            defaultValue={locale}
            name="locale"
          >
            {preferences.enabledLocales.map((value) => (
              <option key={value} lang={value} value={value}>
                {value === "bg" ? "Български" : "English"}
              </option>
            ))}
          </select>
        </label>
        <p>
          {t["locale.facts"]
            .replace("{country}", preferences.dealerCountry)
            .replace("{currency}", preferences.inventoryCurrency)}
        </p>
        <button
          className="min-h-11 rounded-lg bg-foreground px-4 py-3 text-background"
          name="action"
          type="submit"
          value="save"
        >
          {t["locale.save"]}
        </button>
        <button
          className="min-h-11 rounded-lg border px-4 py-3"
          name="action"
          type="submit"
          value="dismiss"
        >
          {t["locale.dismiss"]}
        </button>
      </form>
      <a
        className="mt-6 inline-flex min-h-11 items-center underline"
        href={returnTo}
      >
        {t["locale.back"]}
      </a>
    </main>
  );
}
