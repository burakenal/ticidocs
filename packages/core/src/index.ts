export type Locale = string;

export interface DocsLogo {
  light: string;
  dark: string;
}

export interface DocsThemeFonts {
  /** UI body font family name, e.g. "Plus Jakarta Sans" */
  sans?: string;
  /** Heading / display font; defaults to `sans` when omitted */
  display?: string;
  /** Monospace font for code, e.g. "JetBrains Mono" */
  mono?: string;
  /**
   * Optional Google Fonts (or other) CSS URL. When omitted and custom
   * family names are set, a Google Fonts URL is generated automatically.
   */
  googleFontsUrl?: string;
}

export interface DocsThemeLayout {
  /** Outer shell max width (CSS length). Default: 92rem */
  shellMaxWidth?: string;
  /** Docs article max width. Default: 42rem */
  maxContent?: string;
  /** Left sidebar width. Default: 17.5rem */
  sidebarWidth?: string;
  /** Right TOC width. Default: 14rem */
  tocWidth?: string;
  /** API samples rail width. Default: 27rem */
  apiRailWidth?: string;
}

export interface DocsThemeConfig {
  primaryColor?: string;
  fonts?: DocsThemeFonts;
  layout?: DocsThemeLayout;
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

export interface NavOpenApiGroup {
  group: string;
  openapi: string;
  /** URL prefix for generated API pages. Default: "api" */
  basePath?: string;
  icon?: string;
}

/** MDX page path, titled page ref, or nested OpenAPI group. */
export type NavPageEntry = string | NavPageRef | NavOpenApiGroup;

export interface NavGroup {
  group: string;
  pages: NavPageEntry[];
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
  /**
   * When set, routes become `/{locale}/{version}/...` and content lives under
   * `content/{version}/{locale}/` (with optional fallback to `content/{locale}/`
   * for the default version only).
   */
  versions?: string[];
  /** Must be listed in `versions`. Defaults to `versions[0]`. */
  defaultVersion?: string;
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
  /** Relative path without locale/version, e.g. "getting-started" or "api/products" */
  slug: string;
  filePath: string;
  frontmatter: PageFrontmatter;
  headings: HeadingNode[];
  /** Raw MDX body without frontmatter */
  body: string;
  /** True when this page was resolved via defaultLocale fallback */
  isFallback?: boolean;
  /** Docs version segment when `config.versions` is enabled */
  version?: string;
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

/** True when a `pages[]` entry is a nested OpenAPI group. */
export function isNavOpenApiEntry(
  entry: NavPageEntry,
): entry is NavOpenApiGroup {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "openapi" in entry &&
    typeof (entry as NavOpenApiGroup).openapi === "string"
  );
}

export function isNavExternal(item: NavigationItem): item is NavExternalLink {
  return "href" in item && "title" in item && !("group" in item);
}

export function normalizePageEntry(
  entry: Exclude<NavPageEntry, NavOpenApiGroup>,
): NavPageRef {
  if (typeof entry === "string") {
    return { path: entry === "index" ? "" : entry };
  }
  return {
    title: entry.title,
    path: entry.path === "index" ? "" : entry.path,
  };
}

/**
 * Collect OpenAPI groups from top-level navigation and nested `pages` entries.
 * Order matches config declaration order.
 */
export function listOpenApiGroups(config: DocsConfig): NavOpenApiGroup[] {
  const groups: NavOpenApiGroup[] = [];
  for (const item of config.navigation) {
    if (isNavOpenApiGroup(item)) {
      groups.push(item);
      continue;
    }
    if (!isNavGroup(item)) {
      continue;
    }
    for (const entry of item.pages) {
      if (isNavOpenApiEntry(entry)) {
        groups.push(entry);
      }
    }
  }
  return groups;
}

function openApiSidebarGroup(
  item: NavOpenApiGroup,
  openApiLinks: SidebarPageLink[],
): SidebarGroup {
  const basePath = (item.basePath ?? "api").replace(/^\/+|\/+$/g, "");
  const matched = openApiLinks.filter((link) =>
    basePath
      ? link.slug === basePath || link.slug.startsWith(`${basePath}/`)
      : true,
  );
  return {
    type: "group",
    title: item.group,
    icon: item.icon,
    children: groupOpenApiLinksByTag(matched),
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

export function resolveDefaultVersion(
  config: Pick<DocsConfig, "versions" | "defaultVersion">,
): string | undefined {
  if (!config.versions?.length) {
    return undefined;
  }
  return config.defaultVersion ?? config.versions[0];
}

/**
 * Build a docs path.
 * - Unversioned: `/{locale}` or `/{locale}/{slug}`
 * - Versioned: `/{locale}/{version}` or `/{locale}/{version}/{slug}`
 */
export function localePath(
  locale: Locale,
  slug = "",
  version?: string,
): string {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  const ver = version?.replace(/^\/+|\/+$/g, "");
  if (ver) {
    return clean ? `/${locale}/${ver}/${clean}` : `/${locale}/${ver}`;
  }
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

/** Map key for loaded pages: `locale::slug` or `version::locale::slug`. */
export function pageMapKey(
  locale: Locale,
  slug: string,
  version?: string,
): string {
  return version ? `${version}::${locale}::${slug}` : `${locale}::${slug}`;
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
  version?: string;
}): PageSeo {
  const { config, locale, slug, frontmatter, availableLocales, version } =
    input;
  const titleBase = frontmatter.title ?? config.name;
  const description =
    frontmatter.description ?? config.description ?? config.name;
  const path = localePath(locale, slug, version);
  const canonical = absoluteUrl(config.siteUrl, path);

  const alternates: SeoAlternate[] = availableLocales.map((loc) => ({
    locale: loc,
    url: absoluteUrl(config.siteUrl, localePath(loc, slug, version)),
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
      localePath(config.defaultLocale, slug, version),
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
  version?: string,
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
      return openApiSidebarGroup(item, openApiLinks);
    }

    const children: SidebarNode[] = [];
    for (const entry of item.pages) {
      if (isNavOpenApiEntry(entry)) {
        children.push(openApiSidebarGroup(entry, openApiLinks));
        continue;
      }
      const ref = normalizePageEntry(entry);
      const page = pagesBySlug.get(ref.path);
      const title =
        ref.title ??
        page?.frontmatter.sidebarTitle ??
        page?.frontmatter.title ??
        (ref.path === "" ? "Overview" : ref.path);
      children.push({
        type: "page" as const,
        title,
        slug: ref.path,
        href: localePath(locale, ref.path, version),
        icon: page?.frontmatter.icon ?? item.icon,
      });
    }

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
      if (isNavOpenApiEntry(entry)) {
        continue;
      }
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
