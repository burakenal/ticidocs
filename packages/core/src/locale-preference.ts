/** Cookie + localStorage key for the last chosen docs locale. */
export const LOCALE_COOKIE_NAME = "ticidocs-locale";
export const LOCALE_STORAGE_KEY = "ticidocs-locale";

/** 1 year */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface ResolvePreferredLocaleInput {
  cookieValue?: string | null;
  acceptLanguage?: string | null;
  locales: readonly string[];
  defaultLocale: string;
}

/**
 * Match a BCP-47-ish tag (e.g. `tr-TR`) to a configured locale (`tr`).
 * Exact match first, then primary subtag.
 */
export function matchConfiguredLocale(
  tag: string | null | undefined,
  locales: readonly string[],
): string | undefined {
  if (!tag) {
    return undefined;
  }
  const normalized = tag.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) {
    return undefined;
  }
  const exact = locales.find((locale) => locale.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }
  const primary = normalized.split("-")[0];
  return locales.find((locale) => locale.toLowerCase() === primary);
}

/**
 * Pick the best configured locale from an Accept-Language header value.
 */
export function negotiateLocaleFromAcceptLanguage(
  header: string | null | undefined,
  locales: readonly string[],
): string | undefined {
  if (!header?.trim() || locales.length === 0) {
    return undefined;
  }

  const candidates = header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      const tag = rawTag?.trim() ?? "";
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q" && value) {
          const parsed = Number.parseFloat(value);
          if (!Number.isNaN(parsed)) {
            q = parsed;
          }
        }
      }
      return { tag, q };
    })
    .filter((item) => item.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const matched = matchConfiguredLocale(tag, locales);
    if (matched) {
      return matched;
    }
  }
  return undefined;
}

/**
 * Cookie (last choice) → Accept-Language → defaultLocale.
 */
export function resolvePreferredLocale(
  input: ResolvePreferredLocaleInput,
): string {
  const { locales, defaultLocale } = input;
  const fromCookie = matchConfiguredLocale(input.cookieValue, locales);
  if (fromCookie) {
    return fromCookie;
  }
  const fromHeader = negotiateLocaleFromAcceptLanguage(
    input.acceptLanguage,
    locales,
  );
  if (fromHeader) {
    return fromHeader;
  }
  if (locales.includes(defaultLocale)) {
    return defaultLocale;
  }
  return locales[0] ?? defaultLocale;
}

/** Browser: persist locale so middleware can read it on the next visit. */
export function setLocalePreference(locale: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const value = encodeURIComponent(locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${value}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // private mode / blocked storage
  }
}

export function localeCookieSerialize(locale: string): {
  name: string;
  value: string;
  path: string;
  maxAge: number;
  sameSite: "lax";
} {
  return {
    name: LOCALE_COOKIE_NAME,
    value: locale,
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  };
}
