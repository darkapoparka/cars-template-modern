// biome-ignore-all format: Exact portable policy mirror; changes require source-hash review.
// biome-ignore-all lint/style: Frozen portable source mirror; exact body hash and request/security tests enforce compatibility.
// biome-ignore-all lint/complexity: Frozen portable source mirror; exact body hash and request/security tests enforce compatibility.
// biome-ignore-all lint/performance: Frozen portable source mirror; exact body hash and request/security tests enforce compatibility.
// biome-ignore-all lint/suspicious/noControlCharactersInRegex: Frozen portable source mirror; exact body hash and request/security tests enforce compatibility.
// biome-ignore-all assist/source/useSortedInterfaceMembers: Frozen portable source mirror; exact body hash and request/security tests enforce compatibility.
/**
 * Framework-neutral locale routing and preference policy.
 * No DOM, filesystem, geolocation service, business writes or visitor-global state.
 * Registering a language here does NOT release it in any application.
 */
export const languageRegistry = Object.freeze({
  en: Object.freeze({ name: 'English', direction: 'ltr', formatLocale: 'en' }),
  bg: Object.freeze({ name: 'Български', direction: 'ltr', formatLocale: 'bg-BG' }),
  ar: Object.freeze({ name: 'العربية', direction: 'rtl', formatLocale: 'ar-AE' }),
  de: Object.freeze({ name: 'Deutsch', direction: 'ltr', formatLocale: 'de-DE' }),
  uk: Object.freeze({ name: 'Українська', direction: 'ltr', formatLocale: 'uk-UA' }),
  tr: Object.freeze({ name: 'Türkçe', direction: 'ltr', formatLocale: 'tr-TR' }),
  ro: Object.freeze({ name: 'Română', direction: 'ltr', formatLocale: 'ro-RO' }),
  el: Object.freeze({ name: 'Ελληνικά', direction: 'ltr', formatLocale: 'el-GR' })
} as const);
export type Language = keyof typeof languageRegistry;
export type Direction = 'ltr' | 'rtl';
export const isKnownLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && Object.hasOwn(languageRegistry, value);
export const countries: readonly string[] = Object.freeze(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));
export const isCountry = (value: unknown): value is string =>
  typeof value === 'string' && countries.includes(value);

export interface LocaleConfiguration<L extends Language> {
  readonly schemaVersion: 1;
  readonly dealerId: string;
  readonly dealerName: string;
  readonly defaultLocale: L;
  readonly enabledLocales: readonly L[];
  readonly dealerCountry: string;
  readonly inventoryCurrency: string;
  readonly formatLocales: Readonly<Record<L, string>>;
  readonly preferenceMaxAge: number;
  readonly promptVersion: string;
  /** Optional approximate suggestions, never a substitute for an explicit preference. */
  readonly suggestedLanguages: Readonly<Partial<Record<string, L>>>;
}
export interface ResolvedLocale<L extends Language> {
  locale: L;
  country: string;
  suggestedCountry: string;
  promptDismissed: boolean;
  source: 'url' | 'cookie' | 'header' | 'country' | 'default';
}
export interface LocaleInput {
  readonly url: URL;
  readonly cookie?: string | null;
  readonly acceptLanguage?: string | null;
  /** Populate only from the trusted hosting adapter; never from URL/user input. */
  readonly trustedCountry?: string | null;
}

export function createLocaleRouting<const L extends Language>(input: LocaleConfiguration<L>) {
  if (!input || input.schemaVersion !== 1 || typeof input.dealerId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,127}$/.test(input.dealerId)) {
    throw new Error('Invalid locale configuration identity');
  }
  if (typeof input.dealerName !== 'string' || !input.dealerName.trim()) throw new Error('Missing dealer name');
  if (!Array.isArray(input.enabledLocales) || !input.enabledLocales.length ||
      new Set(input.enabledLocales).size !== input.enabledLocales.length ||
      input.enabledLocales.some(value => !isKnownLanguage(value)) ||
      !input.enabledLocales.includes(input.defaultLocale)) throw new Error('Invalid enabled/default languages');
  if (!isCountry(input.dealerCountry)) throw new Error('Invalid dealer country');
  if (!/^[A-Z]{3}$/.test(input.inventoryCurrency) || !Intl.supportedValuesOf('currency').includes(input.inventoryCurrency)) {
    throw new Error('Invalid inventory currency');
  }
  if (!Number.isSafeInteger(input.preferenceMaxAge) || input.preferenceMaxAge < 1 || input.preferenceMaxAge > 31536000) {
    throw new Error('Preference expiry must be between one second and one year');
  }
  if (typeof input.promptVersion !== 'string' || !/^[a-zA-Z0-9_-]{1,32}$/.test(input.promptVersion)) throw new Error('Invalid prompt version');
  const enabledLocales: readonly L[] = Object.freeze([...input.enabledLocales] as L[]);
  for (const locale of enabledLocales) {
    const format = input.formatLocales?.[locale];
    if (typeof format !== 'string' || new Intl.Locale(format).language !== locale) {
      throw new Error('Each enabled language needs its own explicit formatting locale: ' + locale);
    }
  }
  if (!input.suggestedLanguages || typeof input.suggestedLanguages !== 'object' || Array.isArray(input.suggestedLanguages)) throw new Error('Suggestions must be an explicit map');
  const suggestions = { ...input.suggestedLanguages };
  for (const [country, locale] of Object.entries(suggestions)) {
    if (!isCountry(country) || !input.enabledLocales.includes(locale as L)) throw new Error('Invalid country/language suggestion');
  }
  const directions = Object.freeze(Object.fromEntries(enabledLocales.map(locale => [locale, languageRegistry[locale].direction]))) as Readonly<Record<L, Direction>>;
  const languageNames = Object.freeze(Object.fromEntries(enabledLocales.map(locale => [locale, languageRegistry[locale].name]))) as Readonly<Record<L, string>>;
  const contract = Object.freeze({
    ...input, enabledLocales, directions, languageNames,
    formatLocales: Object.freeze({ ...input.formatLocales }),
    suggestedLanguages: Object.freeze(suggestions),
    disabledLocales: Object.freeze((Object.keys(languageRegistry) as Language[]).filter(locale => !enabledLocales.includes(locale as L)))
  });
  const isLocale = (value: unknown): value is L => typeof value === 'string' && enabledLocales.includes(value as L);
  const intlLocale = (locale: L) => {
    if (!isLocale(locale)) throw new Error('Language is not enabled');
    return contract.formatLocales[locale];
  };
  const formatPrice = (value: number, locale: L): string => {
    if (!Number.isFinite(value)) throw new Error('Price must be finite');
    return new Intl.NumberFormat(intlLocale(locale), {
      style: 'currency', currency: contract.inventoryCurrency, currencyDisplay: 'code', maximumFractionDigits: 0
    }).format(value);
  };
  function routeParts(pathname: string) {
    const base = pathname.match(/^\/variant-[23](?=\/|$)/)?.[0] ?? '';
    const rest = pathname.slice(base.length) || '/';
    const first = rest.split('/')[1] ?? '';
    const locale = isLocale(first) ? first : null;
    return { base, locale, path: locale ? rest.slice(first.length + 1) || '/' : rest, first };
  }
  function isResource(pathname: string) {
    const { path } = routeParts(pathname);
    return /^\/(?:api|_app|_next|assets|dealer-brand|dealer-inventory|brand|images|fonts|ingest)(?:\/|$)/.test(path) || /\.[a-z0-9]{1,12}$/i.test(path);
  }
  function unsupportedLocale(pathname: string) {
    const { first, locale } = routeParts(pathname);
    return !locale && /^[a-z]{2}(?:-[a-z0-9]{2,8})*$/i.test(first);
  }
  function localeHref(href: string, locale: L, defaultBase = ''): string {
    if (!isLocale(locale)) throw new Error('Cannot link to a disabled language');
    if (!['', '/variant-2', '/variant-3'].includes(defaultBase)) throw new Error('Invalid design mount');
    if (!href.startsWith('/') || href.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(href)) return href;
    const split = href.search(/[?#]/);
    const pathname = split < 0 ? href : href.slice(0, split);
    const suffix = split < 0 ? '' : href.slice(split);
    if (isResource(pathname)) return href;
    const parsed = routeParts(pathname);
    const base = parsed.base || defaultBase;
    return `${base}/${locale}${parsed.path === '/' ? '' : parsed.path}${suffix}`;
  }
  function safeReturnPath(value: unknown, origin: string): string | null {
    if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
    try {
      const url = new URL(value, origin);
      // Reject encoded path separators, controls and nested escaping, not legitimate query values.
      if (
        url.origin !== origin ||
        !/^\/(?!\/)/.test(url.pathname) ||
        /%(?:2f|5c|25|0[0-9a-f]|1[0-9a-f]|7f)/i.test(url.pathname)
      ) return null;
      const decoded = decodeURIComponent(url.pathname);
      if (isResource(decoded) || unsupportedLocale(decoded)) return null;
      return url.pathname + url.search + url.hash;
    } catch { return null; }
  }
  return Object.freeze({ contract, countries, isCountry, isLocale, intlLocale, formatPrice, routeParts, isResource, unsupportedLocale, localeHref, safeReturnPath });
}

/* CARS_DEFAULT_PUBLIC_BINDINGS */

/** Reject ambiguous duplicate preferences instead of guessing a cookie path's precedence. */
export function cookieValue(header: string | null | undefined, name: string): string | null {
  if (!header || header.length > 16384) return null;
  const matches = header.split(';').map(value => value.trim()).filter(value => value.startsWith(`${name}=`));
  if (matches.length !== 1) return null;
  try { return decodeURIComponent(matches[0]!.slice(name.length + 1)); } catch { return null; }
}
export function privateHeaders(locale?: string): Headers {
  const headers = new Headers({ 'Cache-Control': 'private, no-store', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store' });
  if (locale) headers.set('Content-Language', locale);
  return headers;
}

/** Create a dealer policy, not a visitor singleton. Each resolution returns a new state. */
export function createLocalePolicy<const L extends Language>(configuration: LocaleConfiguration<L>) {
  const routing = createLocaleRouting(configuration);
  const { contract, isLocale, safeReturnPath, localeHref, routeParts } = routing;
  function preferredLanguage(header: string | null | undefined): L | null {
    if (!header || header.length > 4096) return null;
    const choices = header.split(',').map((part, index) => {
      const [tag = '', ...parameters] = part.trim().toLowerCase().split(';');
      const weights = parameters.map(value => value.trim()).filter(value => value.startsWith('q='));
      const q = weights.length === 0 ? 1 : weights.length === 1 && /^q=(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(weights[0]!) ? Number(weights[0]!.slice(2)) : NaN;
      return { locale: tag.split('-')[0], q, index };
    }).filter((choice): choice is { locale: L; q: number; index: number } => isLocale(choice.locale) && Number.isFinite(choice.q) && choice.q > 0 && choice.q <= 1)
      .sort((a, b) => b.q - a.q || a.index - b.index);
    return choices[0]?.locale ?? null;
  }
  function resolveLocale(input: LocaleInput): ResolvedLocale<L> {
    const savedLocale = cookieValue(input.cookie, 'cars_locale');
    const savedCountry = cookieValue(input.cookie, 'cars_country');
    const trustedCountry = isCountry(input.trustedCountry) ? input.trustedCountry : null;
    const suggestedCountry = trustedCountry ?? contract.dealerCountry;
    const queryLocale = input.url.searchParams.get('lang');
    const explicit = routeParts(input.url.pathname).locale ?? (isLocale(queryLocale) ? queryLocale : null);
    const accepted = preferredLanguage(input.acceptLanguage);
    const countryLanguage = trustedCountry ? contract.suggestedLanguages[trustedCountry] : undefined;
    const suggestedLanguage = isLocale(countryLanguage) ? countryLanguage : null;
    const source = explicit ? 'url' : isLocale(savedLocale) ? 'cookie' : accepted ? 'header' : suggestedLanguage ? 'country' : 'default';
    const locale = explicit ?? (isLocale(savedLocale) ? savedLocale : accepted ?? suggestedLanguage ?? contract.defaultLocale);
    return {
      locale, source, country: isCountry(savedCountry) ? savedCountry : suggestedCountry, suggestedCountry,
      promptDismissed: cookieValue(input.cookie, 'cars_prompt') === contract.promptVersion
    };
  }
  async function preferenceResponse(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const headers = privateHeaders();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    const fail = (status: number) => new Response(JSON.stringify({ error: 'invalid_preference_request' }), { status, headers });
    if (request.method !== 'POST') { headers.set('Allow', 'POST'); return fail(405); }
    if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return fail(403);
    const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (type !== 'application/x-www-form-urlencoded' && type !== 'application/json') return fail(415);
    const declared = request.headers.get('content-length');
    if (declared !== null && !/^\d+$/.test(declared)) return fail(400);
    if (declared !== null && Number(declared) > 4096) return fail(413);
    const reader = request.body?.getReader();
    if (!reader) return fail(400);
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > 4096) { await reader.cancel(); return fail(413); }
        chunks.push(value);
      }
    } catch { return fail(400); }
    finally { reader.releaseLock(); }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    let data: Record<string, unknown>;
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(body);
      if (type === 'application/json') data = JSON.parse(text) as Record<string, unknown>;
      else {
        const params = new URLSearchParams(text);
        if ([...params.keys()].some(key => params.getAll(key).length !== 1)) return fail(400);
        data = Object.fromEntries(params);
      }
      if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !['action', 'locale', 'country', 'returnTo'].includes(key))) return fail(400);
    } catch { return fail(400); }
    if (data.action !== 'save' && data.action !== 'dismiss') return fail(400);
    const returnTo = safeReturnPath(data.returnTo, url.origin);
    if (!returnTo || !isLocale(data.locale) || !isCountry(data.country)) return fail(400);
    const options = `; Path=/; Max-Age=${contract.preferenceMaxAge}; SameSite=Lax; HttpOnly${url.protocol === 'https:' ? '; Secure' : ''}`;
    headers.append('Set-Cookie', `cars_prompt=${contract.promptVersion}${options}`);
    if (data.action === 'save') {
      headers.append('Set-Cookie', `cars_locale=${data.locale}${options}`);
      headers.append('Set-Cookie', `cars_country=${data.country}${options}`);
    }
    const destination = data.action === 'save' ? localeHref(returnTo, data.locale) : returnTo;
    if (type === 'application/json') return new Response(JSON.stringify({ destination }), { status: 200, headers });
    headers.set('Location', destination);
    return new Response(null, { status: 303, headers });
  }
  return Object.freeze({ ...routing, preferredLanguage, resolveLocale, preferenceResponse });
}
