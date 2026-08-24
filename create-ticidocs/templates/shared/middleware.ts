import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Keep in sync with docs.config.ts */
const LOCALES = ["en", "tr"] as const;
const DEFAULT_LOCALE = "en";

/** Locale-less doc paths → /{defaultLocale}/… */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/").filter(Boolean)[0];

  if (!first || LOCALES.includes(first as (typeof LOCALES)[number])) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo\\.svg|sitemap\\.xml|robots\\.txt).*)",
  ],
};
