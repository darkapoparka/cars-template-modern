import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageFlag } from "./language-flag";
import { LanguageSelect } from "./language-select";

describe("language flags", () => {
  for (const locale of ["bg", "en"] as const) {
    it(`keeps the ${locale} flag decorative and a fixed size`, () => {
      const markup = renderToStaticMarkup(
        createElement(LanguageFlag, { locale })
      );

      expect(markup).toContain(`data-language-flag="${locale}"`);
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain("h-3.5 w-5 shrink-0");
      expect(markup).not.toContain("<img");
    });

    it(`retains the native ${locale} selection in server-rendered HTML`, () => {
      const markup = renderToStaticMarkup(
        createElement(
          LanguageSelect,
          {
            defaultValue: locale,
            id: "language",
            name: "locale",
            className: "w-full px-3",
          },
          createElement("option", { value: "bg", lang: "bg" }, "Български"),
          createElement("option", { value: "en", lang: "en" }, "English")
        )
      );

      expect(markup).toContain('id="language" name="locale"');
      expect(markup).toContain(
        `value="${locale}" lang="${locale}" selected=""`
      );
      expect(markup).toContain("pl-11");
      expect(markup).toContain("option[value=bg]:checked");
      expect(markup).toContain("option[value=en]:checked");
      expect(markup).not.toContain("<script");
    });
  }
});
