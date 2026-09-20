import {
  assert,
  check,
  finish,
  mount,
  origin,
  skip,
  url,
} from "./localization-harness.mjs";

const response = (pathname, options = {}) =>
  fetch(url(pathname), {
    ...options,
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
const readOnly = process.env.LOCALE_QA_READ_ONLY === "1";
const development = process.env.LOCALE_QA_DEVELOPMENT === "1";
const checkWrite = (...args) =>
  readOnly
    ? skip(
        args[0],
        "Preference/business POST requests not performed in this read-only run"
      )
    : check(...args);
const other = (locale) => (locale === "en" ? "bg" : "en");
for (const locale of ["en", "bg"]) {
  await check(
    "explicit path beats all hints",
    async () => {
      const r = await response(
        `/${locale}/contact?lang=${other(locale)}&topic=trade-in`,
        {
          headers: {
            cookie: `cars_locale=${other(locale)};cars_country=DE;cars_prompt=v1`,
            "accept-language": other(locale),
            "x-vercel-ip-country": "DE",
            "x-cars-locale": other(locale),
            "x-automarket-internal-locale-rewrite": "1",
          },
        }
      );
      assert.equal(r.status, 200);
      assert.equal(r.headers.get("content-language"), locale);
      assert.equal(r.headers.get("set-cookie"), null);
      const html = await r.text();
      assert.ok(html.includes(`lang="${locale}"`));
      return { status: r.status, headers: Object.fromEntries(r.headers) };
    },
    { locale }
  );
  for (const source of ["query", "cookie", "header"]) {
    await check(
      "legacy negotiation",
      async () => {
        const headers = {
          "accept-language": source === "header" ? locale : other(locale),
        };
        if (source !== "header") {
          headers.cookie = `cars_locale=${source === "cookie" ? locale : other(locale)}`;
        }
        const path = `/cars?make=BMW${source === "query" ? `&lang=${locale}` : ""}`;
        const r = await response(path, { headers });
        assert.equal(r.status, 307);
        const destination = new URL(r.headers.get("location"), origin.origin);
        assert.equal(destination.pathname, `${mount}/${locale}/cars`);
        assert.equal(destination.searchParams.get("make"), "BMW");
        assert.equal(destination.origin, origin.origin);
        assert.equal(r.headers.get("set-cookie"), null);
        return {
          location: destination.href,
          cache: r.headers.get("cache-control"),
        };
      },
      { locale, source }
    );
  }
}
for (const locale of ["ar", "de", "uk", "tr", "ro", "el"]) {
  await check(
    "disabled locale",
    async () => {
      const r = await response(`/${locale}/cars`);
      assert.equal(r.status, 404);
      assert.equal(r.headers.get("location"), null);
      assert.equal(r.headers.get("set-cookie"), null);
    },
    { locale }
  );
}
const data = {
  action: "save",
  locale: "bg",
  country: "DE",
  returnTo: `${mount}/en/contact?topic=trade-in#details`,
};
const post = (body = data, headers = {}, type = "application/json") =>
  response("/api/preferences", {
    method: "POST",
    headers: { origin: origin.origin, "content-type": type, ...headers },
    body:
      type === "application/json"
        ? JSON.stringify(body)
        : new URLSearchParams(body),
  });
await checkWrite("preference save and cookie attributes", async () => {
  const r = await post();
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), {
    destination: `${mount}/bg/contact?topic=trade-in#details`,
  });
  const cookies = r.headers.getSetCookie();
  assert.equal(cookies.length, 3);
  for (const cookie of cookies) {
    for (const value of [
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=15552000",
    ]) {
      assert.ok(cookie.includes(value), cookie);
    }
    assert.ok(!cookie.includes("Domain="));
    assert.equal(cookie.includes("Secure"), origin.protocol === "https:");
  }
  return { cookies, cache: r.headers.get("cache-control") };
});
await checkWrite("dismissal does not accept preferences", async () => {
  const r = await post({ ...data, action: "dismiss" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.getSetCookie().length, 1);
  assert.ok(r.headers.getSetCookie()[0].startsWith("cars_prompt="));
  assert.deepEqual(await r.json(), { destination: data.returnTo });
});
await checkWrite("native no-JS POST", async () => {
  const r = await post(data, {}, "application/x-www-form-urlencoded");
  assert.equal(r.status, 303);
  assert.equal(
    r.headers.get("location"),
    `${mount}/bg/contact?topic=trade-in#details`
  );
});
for (const [name, patch, headers, status] of [
  ["cross origin", {}, { origin: "https://foreign.invalid" }, 403],
  ["opaque origin", {}, { origin: "null" }, 403],
  ["cross site", {}, { "sec-fetch-site": "cross-site" }, 403],
  ["disabled language", { locale: "ar" }, {}, 400],
  ["invalid country", { country: "ZZ" }, {}, 400],
  ["open redirect", { returnTo: "//foreign.invalid" }, {}, 400],
  ["encoded slash", { returnTo: "/%2f%2fforeign.invalid" }, {}, 400],
  ["API return", { returnTo: `${mount}/api/preferences` }, {}, 400],
  [
    "unexpected field",
    { email: "must-not-be-accepted@example.invalid" },
    {},
    400,
  ],
  ["oversized body", { returnTo: `/${"a".repeat(5000)}` }, {}, 413],
]) {
  await checkWrite(name, async () => {
    const r = await post({ ...data, ...patch }, headers);
    assert.equal(r.status, status);
    assert.equal(r.headers.get("set-cookie"), null);
  });
}
await check("preference method restriction", async () => {
  const r = await response("/api/preferences");
  assert.equal(r.status, 405);
  assert.equal(r.headers.get("set-cookie"), null);
});
await checkWrite("public business writes blocked", async () => {
  const r = await response("/en/contact", {
    method: "POST",
    headers: {
      origin: origin.origin,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "__localization_guard_probe=1",
  });
  assert.equal(r.status, 403);
});
await checkWrite("existing local filter parser retained", async () => {
  const r = await response("/api/ai/search", {
    method: "POST",
    headers: { origin: origin.origin, "content-type": "application/json" },
    body: JSON.stringify({
      query: "BMW automatic after 2020",
      locale: "en",
      category: "car",
      basePath: "/en/cars",
    }),
  });
  assert.equal(r.status, 200);
  const result = await r.json();
  assert.ok(result.filters);
  return { mode: result.mode, href: result.href };
});
await check(
  "public image and framework assets stay outside locale routing",
  async () => {
    const r = await response("/lead-logo.png");
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("location"), null);
    assert.ok(r.headers.get("content-type")?.startsWith("image/"));
  }
);
const rscStatePattern = /"state":({[^{}]+})/;
const htmlCountryPattern = /data-preference-country="([A-Z]{2})"/;
const htmlDismissedPattern = /data-prompt-dismissed="(true|false)"/;
async function readVisitorState(locale, rsc, country, index, pathname) {
  const r = await response(`/${locale}${pathname}${rsc ? "?_rsc" : ""}`, {
    headers: {
      cookie: `cars_locale=${index ? "en" : "bg"};cars_country=${country}${index ? ";cars_prompt=v1" : ""}`,
      ...(rsc ? { RSC: "1" } : {}),
    },
  });
  const body = await r.text();
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-language"), locale);
  const cache = r.headers.get("cache-control") ?? "";
  assert.ok(
    cache.includes("no-store") || (development && cache.includes("no-cache")),
    cache
  );
  assert.equal(r.headers.get("cdn-cache-control"), "no-store");
  const stateMatch = rsc ? body.match(rscStatePattern) : null;
  const state = stateMatch ? JSON.parse(stateMatch[1]) : null;
  const rendered = rsc ? state?.country : body.match(htmlCountryPattern)?.[1];
  assert.equal(rendered, country, body.slice(0, 500));
  const dismissed = rsc
    ? String(state?.promptDismissed)
    : body.match(htmlDismissedPattern)?.[1];
  assert.equal(dismissed, index ? "true" : "false");
  return {
    country,
    rendered,
    dismissed,
    cache,
    vercelCache: r.headers.get("x-vercel-cache"),
    contentType: r.headers.get("content-type"),
  };
}
for (const locale of ["en", "bg"]) {
  for (const rsc of [false, true]) {
    for (const pathname of [
      "/cars",
      "/legal/privacy",
      "/guides/buying-used-car-bulgaria",
    ]) {
      await check(
        "actual same-URL cross-visitor isolation",
        async () => {
          const records = [];
          for (let round = 0; round < 4; round++) {
            records.push(
              await Promise.all(
                ["GB", "DE"].map((country, index) =>
                  readVisitorState(locale, rsc, country, index, pathname)
                )
              )
            );
          }
          return records;
        },
        { locale, rsc, pathname, development }
      );
    }
  }
}
finish();
