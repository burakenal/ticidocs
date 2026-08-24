import path from "node:path";
import docsConfig from "../docs.config";
import {
  buildPageSeo,
  buildSidebar,
  isNavOpenApiGroup,
  listSlugsFromNavigation,
  localePath,
  localesForSlug,
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
  if (process.env.NODE_ENV === "development") {
    return loadAllPages(contentRoot, docsConfig.locales);
  }
  if (!pagesCache) {
    pagesCache = loadAllPages(contentRoot, docsConfig.locales);
  }
  return pagesCache;
}

export function getPage(locale: string, slug: string): DocPage | undefined {
  return getPageFromMap(getAllPages(), locale, slug);
}

export function resolveDocPage(locale: string, slug: string) {
  return resolvePageWithFallback({
    locale,
    slug,
    defaultLocale: docsConfig.defaultLocale,
    getPage,
  });
}

export function getOpenApiDocuments(): ParsedOpenApi[] {
  if (process.env.NODE_ENV !== "development" && openApiCache) {
    return openApiCache;
  }

  const docs = docsConfig.navigation.filter(isNavOpenApiGroup).map((item) => {
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

export function getOpenApiSidebarLinks(locale: string): SidebarPageLink[] {
  return getAllApiOperations().map((operation) => ({
    type: "page" as const,
    title:
      operation.summary ??
      operation.operationId ??
      `${operation.method.toUpperCase()} ${operation.path}`,
    slug: operation.slug,
    href: localePath(locale, operation.slug),
    method: operation.method,
    tags: operation.tags,
  }));
}

export function getSidebar(locale: string) {
  const pages = getAllPages();
  const bySlug = new Map<string, DocPage>();
  for (const page of pages.values()) {
    if (page.locale === locale) {
      bySlug.set(page.slug, page);
    }
  }
  for (const page of pages.values()) {
    if (page.locale === docsConfig.defaultLocale && !bySlug.has(page.slug)) {
      bySlug.set(page.slug, page);
    }
  }
  return buildSidebar(
    docsConfig,
    locale,
    bySlug,
    getOpenApiSidebarLinks(locale),
  );
}

export function getSearchDocuments(locale?: string): SearchDocument[] {
  const pages = [...getAllPages().values()].filter((page) =>
    locale ? page.locale === locale : true,
  );
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
        id: `${loc}::${operation.slug}`,
        locale: loc,
        slug: operation.slug,
        href: localePath(loc, operation.slug),
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

export function getSeoForPage(locale: string, slug: string, page: DocPage) {
  const available = localesForSlug(slug, docsConfig.locales, (loc, s) =>
    Boolean(getPage(loc, s)),
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
  });
}

export function getSeoForApi(locale: string, operation: ApiOperation) {
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

  const params: { locale: string; slug?: string[] }[] = [];
  for (const locale of docsConfig.locales) {
    for (const slug of slugs) {
      params.push({
        locale,
        slug: slug ? slug.split("/") : undefined,
      });
    }
  }
  return params;
}

export function slugFromParams(slug?: string[]): string {
  return slug?.join("/") ?? "";
}

export function hrefFor(locale: string, slug: string): string {
  return localePath(locale, slug);
}

export { docsConfig, contentRoot };
