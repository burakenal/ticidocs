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
  /** OpenAPI tags used to nest endpoints under category submenus */
  tags?: string[];
}

export interface SidebarExternalLink {
  type: "external";
  title: string;
  href: string;
}

export type SidebarNode = SidebarPageLink | SidebarGroup;

export interface SidebarGroup {
  type: "group";
  title: string;
  icon?: string;
  children: SidebarNode[];
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

export interface ArticleJsonLd {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  inLanguage: string;
  url: string;
  isPartOf: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
}

export function buildArticleJsonLd(input: {
  seo: PageSeo;
  siteName: string;
  siteUrl: string;
}): ArticleJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.seo.title,
    description: input.seo.description,
    inLanguage: input.seo.locale,
    url: input.seo.canonical,
    isPartOf: {
      "@type": "WebSite",
      name: input.siteName,
      url: input.siteUrl.replace(/\/+$/, ""),
    },
  };
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

/** Nest OpenAPI endpoint links under their first tag (Scalar-style). */
export function groupOpenApiLinksByTag(
  links: SidebarPageLink[],
): SidebarNode[] {
  const order: string[] = [];
  const byTag = new Map<string, SidebarPageLink[]>();
  const untagged: SidebarPageLink[] = [];

  for (const link of links) {
    const tag = link.tags?.find((t) => t.trim().length > 0)?.trim();
    if (!tag) {
      untagged.push(link);
      continue;
    }
    if (!byTag.has(tag)) {
      order.push(tag);
      byTag.set(tag, []);
    }
    byTag.get(tag)!.push(link);
  }

  const groups: SidebarNode[] = order.map((tag) => ({
    type: "group" as const,
    title: tag,
    children: byTag.get(tag)!,
  }));

  return [...groups, ...untagged];
}

export interface SectionTab {
  title: string;
  href: string;
  active: boolean;
  external?: boolean;
}

function sidebarNodeContainsPath(
  node: SidebarNode,
  currentPath: string,
): boolean {
  if (node.type === "page") {
    return node.href === currentPath;
  }
  return node.children.some((child) =>
    sidebarNodeContainsPath(child, currentPath),
  );
}

/** First navigable page href inside a sidebar node tree. */
export function firstSidebarHref(nodes: SidebarNode[]): string | undefined {
  for (const node of nodes) {
    if (node.type === "page") {
      return node.href;
    }
    const nested = firstSidebarHref(node.children);
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

/**
 * Active top-level section for Upstash-style product tabs + scoped sidebar.
 * Prefers the group that contains `currentPath`; falls back to the first group.
 */
export function resolveActiveSection(
  sidebar: SidebarItem[],
  currentPath: string,
): SidebarGroup | undefined {
  const groups = sidebar.filter(
    (item): item is SidebarGroup => item.type === "group",
  );
  const matched = groups.find((group) =>
    group.children.some((child) => sidebarNodeContainsPath(child, currentPath)),
  );
  return matched ?? groups[0];
}

/** Horizontal product/section tabs derived from top-level sidebar items. */
export function buildSectionTabs(
  sidebar: SidebarItem[],
  currentPath: string,
): SectionTab[] {
  const active = resolveActiveSection(sidebar, currentPath);
  const tabs: SectionTab[] = [];

  for (const item of sidebar) {
    if (item.type === "external") {
      tabs.push({
        title: item.title,
        href: item.href,
        active: false,
        external: true,
      });
      continue;
    }

    const href = firstSidebarHref(item.children);
    if (!href) {
      continue;
    }
    tabs.push({
      title: item.title,
      href,
      active: active?.title === item.title,
    });
  }

  return tabs;
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
      const matched = openApiLinks.filter((link) =>
        basePath
          ? link.slug === basePath || link.slug.startsWith(`${basePath}/`)
          : true,
      );
      return {
        type: "group" as const,
        title: item.group,
        icon: item.icon,
        children: groupOpenApiLinksByTag(matched),
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
