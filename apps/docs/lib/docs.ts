import path from "node:path";
import docsConfig from "../docs.config";
import {
  buildPageSeo,
  buildSidebar,
  listOpenApiGroups,
  listSlugsFromNavigation,
  localePath,
  localesForSlug,
  resolveDefaultVersion,
  resolvePageWithFallback,
  type DocPage,
  type DocsConfig,
  type SidebarPageLink,
} from "@ticidocs/core";
import { getPageFromMap, loadAllPages } from "@ticidocs/mdx";
import {
  findOperationBySlug,
  loadOpenApiFile,
  type ApiOperation,
  type ParsedOpenApi,
} from "@ticidocs/openapi";
import { buildSearchDocuments, type SearchDocument } from "@ticidocs/search";

const contentRoot = path.join(process.cwd(), "content");
const projectRoot = process.cwd();

let pagesCache: Map<string, DocPage> | undefined;
let openApiCache: ParsedOpenApi[] | undefined;

export function getDocsConfig(): DocsConfig {
  return docsConfig;
}

export function getAllPages(): Map<string, DocPage> {
  const versions = docsConfig.versions;
  const load = () =>
    loadAllPages(contentRoot, docsConfig.locales, versions, {
      defaultVersion: resolveDefaultVersion(docsConfig),
    });

  if (process.env.NODE_ENV === "development") {
    return load();
  }
  if (!pagesCache) {
    pagesCache = load();
  }
  return pagesCache;
}

export function getPage(
  locale: string,
  slug: string,
  version?: string,
): DocPage | undefined {
  return getPageFromMap(getAllPages(), locale, slug, version);
}

export function resolveDocPage(
  locale: string,
  slug: string,
  version?: string,
) {
  return resolvePageWithFallback({
    locale,
    slug,
    defaultLocale: docsConfig.defaultLocale,
    getPage: (loc, s) => getPage(loc, s, version),
  });
}

export function getOpenApiDocuments(): ParsedOpenApi[] {
  if (process.env.NODE_ENV !== "development" && openApiCache) {
    return openApiCache;
  }

  const docs = listOpenApiGroups(docsConfig).map((item) => {
    const filePath = path.resolve(projectRoot, item.openapi);
    return loadOpenApiFile(filePath, { basePath: item.basePath ?? "api" });
  });

  if (process.env.NODE_ENV !== "development") {
    openApiCache = docs;
  }
  return docs;
}

export function getAllApiOperations(): ApiOperation[] {
  return getOpenApiDocuments().flatMap((doc) => doc.operations);
}

export function resolveApiOperation(
  slug: string,
): { operation: ApiOperation; document: ParsedOpenApi } | undefined {
  for (const document of getOpenApiDocuments()) {
    const operation = findOperationBySlug(document, slug);
    if (operation) {
      return { operation, document };
    }
  }
  return undefined;
}

export function getOpenApiSidebarLinks(
  locale: string,
  version?: string,
): SidebarPageLink[] {
  return getAllApiOperations().map((operation) => ({
    type: "page" as const,
    title: operation.path,
    slug: operation.slug,
    href: localePath(locale, operation.slug, version),
    method: operation.method,
    tags: operation.tags,
  }));
}

export function getSidebar(locale: string, version?: string) {
  const pages = getAllPages();
  const bySlug = new Map<string, DocPage>();
  for (const page of pages.values()) {
    if (version && page.version && page.version !== version) {
      continue;
    }
    if (page.locale === locale) {
      bySlug.set(page.slug, page);
    }
  }
  for (const page of pages.values()) {
    if (version && page.version && page.version !== version) {
      continue;
    }
    if (page.locale === docsConfig.defaultLocale && !bySlug.has(page.slug)) {
      bySlug.set(page.slug, page);
    }
  }
  return buildSidebar(
    docsConfig,
    locale,
    bySlug,
    getOpenApiSidebarLinks(locale, version),
    version,
  );
}

export function getSearchDocuments(
  locale?: string,
  version?: string,
): SearchDocument[] {
  const pages = [...getAllPages().values()].filter((page) => {
    if (locale && page.locale !== locale) {
      return false;
    }
    if (version && page.version && page.version !== version) {
      return false;
    }
    return true;
  });
  const pageDocs = buildSearchDocuments(pages, (page) => {
    const title =
      page.frontmatter.sidebarTitle ?? page.frontmatter.title ?? page.slug;
    return `${docsConfig.name} / ${title}`;
  });

  const locales = locale ? [locale] : docsConfig.locales;
  const apiDocs: SearchDocument[] = [];
  for (const loc of locales) {
    for (const operation of getAllApiOperations()) {
      apiDocs.push({
        id: version
          ? `${version}::${loc}::${operation.slug}`
          : `${loc}::${operation.slug}`,
        locale: loc,
        slug: operation.slug,
        href: localePath(loc, operation.slug, version),
        title:
          operation.summary ??
          `${operation.method.toUpperCase()} ${operation.path}`,
        description: operation.description ?? "",
        breadcrumb: `${docsConfig.name} / API / ${operation.path}`,
        body: [
          operation.method,
          operation.path,
          operation.summary,
          operation.description,
          ...operation.tags,
        ]
          .filter(Boolean)
          .join(" "),
      });
    }
  }

  return [...pageDocs, ...apiDocs];
}

export function getSeoForPage(
  locale: string,
  slug: string,
  page: DocPage,
  version?: string,
) {
  const available = localesForSlug(slug, docsConfig.locales, (loc, s) =>
    Boolean(getPage(loc, s, version)),
  );
  const locales = Array.from(
    new Set([locale, docsConfig.defaultLocale, ...available]),
  );
  return buildPageSeo({
    config: docsConfig,
    locale,
    slug,
    frontmatter: page.frontmatter,
    availableLocales: locales,
    version,
  });
}

export function getSeoForApi(
  locale: string,
  operation: ApiOperation,
  version?: string,
) {
  return buildPageSeo({
    config: docsConfig,
    locale,
    slug: operation.slug,
    frontmatter: {
      title:
        operation.summary ??
        `${operation.method.toUpperCase()} ${operation.path}`,
      description: operation.description,
    },
    availableLocales: docsConfig.locales,
    version,
  });
}

export function getStaticLocaleSlugParams() {
  const slugs = new Set(listSlugsFromNavigation(docsConfig));
  for (const page of getAllPages().values()) {
    slugs.add(page.slug);
  }
  for (const operation of getAllApiOperations()) {
    slugs.add(operation.slug);
  }

  const versions = docsConfig.versions;
  const params: { locale: string; slug?: string[] }[] = [];

  for (const locale of docsConfig.locales) {
    if (!versions?.length) {
      for (const slug of slugs) {
        params.push({
          locale,
          slug: slug ? slug.split("/") : undefined,
        });
      }
      continue;
    }

    for (const version of versions) {
      for (const slug of slugs) {
        params.push({
          locale,
          slug: slug ? [version, ...slug.split("/")] : [version],
        });
      }
    }
  }
  return params;
}

export function slugFromParams(slug?: string[]): string {
  return slug?.join("/") ?? "";
}

export interface ParsedDocsRoute {
  locale: string;
  version?: string;
  slug: string;
  /** True when versions are configured but the URL omitted the version segment. */
  missingVersion?: boolean;
  defaultVersion?: string;
}

export function parseDocsRoute(
  locale: string,
  slugParts?: string[],
): ParsedDocsRoute {
  const versions = docsConfig.versions;
  if (!versions?.length) {
    return { locale, slug: slugFromParams(slugParts) };
  }

  const defaultVersion = resolveDefaultVersion(docsConfig)!;
  const first = slugParts?.[0];
  if (first && versions.includes(first)) {
    return {
      locale,
      version: first,
      slug: slugFromParams(slugParts.slice(1)),
    };
  }

  return {
    locale,
    slug: slugFromParams(slugParts),
    missingVersion: true,
    defaultVersion,
  };
}

export function hrefFor(
  locale: string,
  slug: string,
  version?: string,
): string {
  return localePath(locale, slug, version);
}

export { docsConfig, contentRoot };
