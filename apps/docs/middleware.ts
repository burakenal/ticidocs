import {
  LOCALE_COOKIE_NAME,
  localeCookieSerialize,
  resolvePreferredLocale,
} from "@ticidocs/core";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Keep in sync with docs.config.ts */
const LOCALES = ["en", "tr"] as const;
const DEFAULT_LOCALE = "en";

function preferredLocale(request: NextRequest): string {
  return resolvePreferredLocale({
    cookieValue: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
  });
}

function withLocaleCookie(response: NextResponse, locale: string): NextResponse {
  const cookie = localeCookieSerialize(locale);
  response.cookies.set(cookie.name, cookie.value, {
    path: cookie.path,
    maxAge: cookie.maxAge,
    sameSite: cookie.sameSite,
  });
  return response;
}

/**
 * Locale-less paths (including `/`) → preferred locale:
 * cookie (last choice) → Accept-Language → defaultLocale.
 * Visiting a locale path refreshes the preference cookie.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/").filter(Boolean)[0];

  if (first && LOCALES.includes(first as (typeof LOCALES)[number])) {
    return withLocaleCookie(NextResponse.next(), first);
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();

  if (!first) {
    url.pathname = `/${locale}`;
  } else {
    url.pathname = `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  }

  return withLocaleCookie(NextResponse.redirect(url), locale);
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|logo\\.png|sitemap\\.xml|robots\\.txt).*)",
  ],
};
