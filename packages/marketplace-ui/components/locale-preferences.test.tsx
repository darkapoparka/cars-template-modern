import { getPreferenceMessages } from "@repo/internationalization/preferences-messages";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocalePreferencesProvider } from "./locale-preferences";

const props = {
  children: <main>Inventory</main>,
  state: {
    locale: "en",
    country: "DE",
    suggestedCountry: "BG",
    promptDismissed: true,
    source: "url",
  },
  returnTo: "/en/cars?sort=price-asc",
  countryOptions: [
    { code: "BG", name: "Bulgaria" },
    { code: "DE", name: "Germany" },
  ],
  messages: getPreferenceMessages("en"),
  dealerName: "Example showroom",
  dealerCountry: "Bulgaria",
  inventoryCurrency: "BGN",
  enabledLocales: ["bg", "en"],
  promptVersion: "test",
} satisfies Parameters<typeof LocalePreferencesProvider>[0];

describe("locale preference choices", () => {
  for (const locale of ["bg", "en"] as const) {
    it(`renders both flag options with only ${locale} selected`, () => {
      const markup = renderToStaticMarkup(
        <LocalePreferencesProvider
          {...props}
          messages={getPreferenceMessages(locale)}
          state={{ ...props.state, locale }}
        />
      );

      expect(markup.match(/type="radio"/g)).toHaveLength(2);
      expect(markup.match(/checked=""/g)).toHaveLength(1);
      expect(markup).toContain(`name="locale" checked="" value="${locale}"`);
      expect(markup).toContain('data-language-flag="bg"');
      expect(markup).toContain('data-language-flag="en"');
      expect(markup).toContain(
        '<option value="DE" selected="">Germany</option>'
      );
      expect(markup).toContain('<option value="BG">Bulgaria</option>');
      expect(markup).toContain("data-locale-country-chevron");
      expect(markup).toContain("appearance-none truncate");
      expect(markup).toContain("rounded-md bg-transparent");
      expect(markup).toContain("h-11 w-28 shrink-0");
      expect(markup).toContain("<fieldset");
      expect(markup).toContain("<legend");
      expect(markup).toContain('aria-labelledby="locale-preferences-title"');
      expect(markup).toContain("data-locale-actions");
    });
  }

  it("does not offer disabled languages", () => {
    const markup = renderToStaticMarkup(
      <LocalePreferencesProvider {...props} enabledLocales={["en"]} />
    );
    expect(markup.match(/type="radio"/g)).toHaveLength(1);
    expect(markup).not.toContain('data-language-option="bg"');
  });
});
