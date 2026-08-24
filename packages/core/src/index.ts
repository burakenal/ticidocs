export type Locale = string;

export interface DocsLogo {
  light: string;
  dark: string;
}

export interface DocsThemeConfig {
  primaryColor?: string;
}

export interface DocsGithubConfig {
  url: string;
}

export interface DocsApiConfig {
  /** Origins allowed for browser Try It requests (no server proxy). */
  allowedOrigins: string[];
}

export interface NavPageRef {
  title?: string;
  path: string;
}

export type NavPageEntry = string | NavPageRef;

export interface NavGroup {
  group: string;
  pages: NavPageEntry[];
  icon?: string;
}

export interface NavOpenApiGroup {
  group: string;
  openapi: string;
  /** URL prefix for generated API pages. Default: "api" */
  basePath?: string;
  icon?: string;
}

export interface NavExternalLink {
  title: string;
  href: string;
  external?: true;
}

export type NavigationItem = NavGroup | NavOpenApiGroup | NavExternalLink;

export interface DocsConfig {
  name: string;
  description?: string;
  siteUrl: string;
  locales: Locale[];
  defaultLocale: Locale;
  logo?: DocsLogo;
  navigation: NavigationItem[];
  theme?: DocsThemeConfig;
  github?: DocsGithubConfig;
  api?: DocsApiConfig;
}

export interface PageFrontmatter {
  title?: string;
  description?: string;
  sidebarTitle?: string;
  slug?: string;
  draft?: boolean;
  order?: number;
  icon?: string;
  noindex?: boolean;
}

export interface HeadingNode {
  id: string;
  text: string;
  depth: 1 | 2 | 3;
}

export interface DocPage {
  locale: Locale;
  /** Relative path without locale, e.g. "getting-started" or "api/products" */
  slug: string;
  filePath: string;
  frontmatter: PageFrontmatter;
  headings: HeadingNode[];
  /** Raw MDX body without frontmatter */
  body: string;
  /** True when this page was resolved via defaultLocale fallback */
  isFallback?: boolean;
}

export interface SidebarPageLink {
  type: "page";
  title: string;
  href: string;
  slug: string;
  icon?: string;
  /** HTTP method for OpenAPI sidebar rows (e.g. "get") */
  method?: string;
}

export interface SidebarExternalLink {
  type: "external";
  title: string;
  href: string;
}

export interface SidebarGroup {
  type: "group";
  title: string;
  icon?: string;
  children: SidebarPageLink[];
}

export type SidebarItem = SidebarGroup | SidebarExternalLink;

export interface SeoAlternate {
  locale: Locale;
  url: string;
}

export interface PageSeo {
  title: string;
  description: string;
  canonical: string;
  locale: Locale;
  ogLocale: string;
  noindex: boolean;
  alternates: SeoAlternate[];
  xDefault: string;
}

export function isNavGroup(item: NavigationItem): item is NavGroup {
  return "group" in item && Array.isArray((item as NavGroup).pages);
}

export function isNavOpenApiGroup(item: NavigationItem): item is NavOpenApiGroup {
  return "group" in item && typeof (item as NavOpenApiGroup).openapi === "string";
}

export function isNavExternal(item: NavigationItem): item is NavExternalLink {
  return "href" in item && "title" in item && !("group" in item);
}

export function normalizePageEntry(entry: NavPageEntry): NavPageRef {
  if (typeof entry === "string") {
    return { path: entry === "index" ? "" : entry };
  }
  return {
    title: entry.title,
    path: entry.path === "index" ? "" : entry.path,
  };
}

export function assertValidLocale(
  locale: string,
  locales: readonly string[],
): asserts locale is Locale {
  if (!locales.includes(locale)) {
    throw new Error(
      `Unknown locale "${locale}". Configured locales: ${locales.join(", ")}`,
    );
  }
}

export function localePath(locale: Locale, slug = ""): string {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

export function absoluteUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Map BCP-47-ish locale codes to Open Graph locale form (en -> en_US, tr -> tr_TR). */
export function toOgLocale(locale: Locale): string {
  const map: Record<string, string> = {
    en: "en_US",
    tr: "tr_TR",
    de: "de_DE",
    fr: "fr_FR",
    es: "es_ES",
  };
  if (map[locale]) {
    return map[locale];
  }
  if (locale.includes("-") || locale.includes("_")) {
    return locale.replace("-", "_");
  }
  return `${locale}_${locale.toUpperCase()}`;
}

export function buildPageSeo(input: {
  config: Pick<DocsConfig, "name" | "description" | "siteUrl" | "defaultLocale">;
  locale: Locale;
  slug: string;
  frontmatter: PageFrontmatter;
  availableLocales: Locale[];
}): PageSeo {
  const { config, locale, slug, frontmatter, availableLocales } = input;
  const titleBase = frontmatter.title ?? config.name;
  const description =
    frontmatter.description ?? config.description ?? config.name;
  const path = localePath(locale, slug);
  const canonical = absoluteUrl(config.siteUrl, path);

  const alternates: SeoAlternate[] = availableLocales.map((loc) => ({
    locale: loc,
    url: absoluteUrl(config.siteUrl, localePath(loc, slug)),
  }));

  return {
    title: titleBase,
    description,
    canonical,
    locale,
    ogLocale: toOgLocale(locale),
    noindex: Boolean(frontmatter.noindex),
    alternates,
    xDefault: absoluteUrl(
      config.siteUrl,
      localePath(config.defaultLocale, slug),
    ),
  };
}

export function buildSidebar(
  config: DocsConfig,
  locale: Locale,
  pagesBySlug: Map<string, DocPage>,
  openApiLinks: SidebarPageLink[] = [],
): SidebarItem[] {
  assertValidLocale(locale, config.locales);

  return config.navigation.map((item) => {
    if (isNavExternal(item)) {
      return {
        type: "external" as const,
        title: item.title,
        href: item.href,
      };
    }

    if (isNavOpenApiGroup(item)) {
      const basePath = (item.basePath ?? "api").replace(/^\/+|\/+$/g, "");
      const children = openApiLinks.filter((link) =>
        basePath ? link.slug === basePath || link.slug.startsWith(`${basePath}/`) : true,
      );
      return {
        type: "group" as const,
        title: item.group,
        icon: item.icon,
        children,
      };
    }

    const children: SidebarPageLink[] = item.pages.map((entry) => {
      const ref = normalizePageEntry(entry);
      const page = pagesBySlug.get(ref.path);
      const title =
        ref.title ??
        page?.frontmatter.sidebarTitle ??
        page?.frontmatter.title ??
        (ref.path === "" ? "Overview" : ref.path);
      return {
        type: "page" as const,
        title,
        slug: ref.path,
        href: localePath(locale, ref.path),
        icon: page?.frontmatter.icon ?? item.icon,
      };
    });

    return {
      type: "group" as const,
      title: item.group,
      icon: item.icon,
      children,
    };
  });
}

export function resolvePageWithFallback(input: {
  locale: Locale;
  slug: string;
  defaultLocale: Locale;
  getPage: (locale: Locale, slug: string) => DocPage | undefined;
}): { page: DocPage; isFallback: boolean } | undefined {
  const { locale, slug, defaultLocale, getPage } = input;
  const direct = getPage(locale, slug);
  if (direct) {
    return { page: { ...direct, isFallback: false }, isFallback: false };
  }
  if (locale === defaultLocale) {
    return undefined;
  }
  const fallback = getPage(defaultLocale, slug);
  if (!fallback) {
    return undefined;
  }
  return {
    page: { ...fallback, locale, isFallback: true },
    isFallback: true,
  };
}

export function listSlugsFromNavigation(config: DocsConfig): string[] {
  const slugs = new Set<string>();
  for (const item of config.navigation) {
    if (!isNavGroup(item)) {
      continue;
    }
    for (const entry of item.pages) {
      const ref = normalizePageEntry(entry);
      slugs.add(ref.path);
    }
  }
  return [...slugs];
}

export function localesForSlug(
  slug: string,
  locales: readonly Locale[],
  hasPage: (locale: Locale, slug: string) => boolean,
): Locale[] {
  return locales.filter((locale) => hasPage(locale, slug));
}
