import MiniSearch from "minisearch";
import { localePath, type DocPage, type Locale } from "@ticidocs/core";

export interface SearchDocument {
  id: string;
  locale: Locale;
  slug: string;
  href: string;
  title: string;
  description: string;
  breadcrumb: string;
  body: string;
}

export interface SearchHit {
  id: string;
  locale: Locale;
  slug: string;
  href: string;
  title: string;
  description: string;
  breadcrumb: string;
  score: number;
}

export function toSearchDocument(
  page: DocPage,
  breadcrumb = "Docs",
): SearchDocument {
  const title =
    page.frontmatter.sidebarTitle ??
    page.frontmatter.title ??
    (page.slug || "Overview");
  const description = page.frontmatter.description ?? "";
  return {
    id: `${page.locale}::${page.slug}`,
    locale: page.locale,
    slug: page.slug,
    href: localePath(page.locale, page.slug),
    title,
    description,
    breadcrumb,
    body: stripMarkdown(page.body),
  };
}

export function buildSearchDocuments(
  pages: Iterable<DocPage>,
  breadcrumbFor?: (page: DocPage) => string,
): SearchDocument[] {
  return [...pages].map((page) =>
    toSearchDocument(page, breadcrumbFor?.(page) ?? "Docs"),
  );
}

export function createSearchIndex(documents: SearchDocument[]): MiniSearch<SearchDocument> {
  const index = new MiniSearch<SearchDocument>({
    fields: ["title", "description", "body", "breadcrumb"],
    storeFields: [
      "locale",
      "slug",
      "href",
      "title",
      "description",
      "breadcrumb",
    ],
    searchOptions: {
      boost: { title: 4, description: 2, breadcrumb: 1.5, body: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  index.addAll(documents);
  return index;
}

export function searchDocuments(
  documents: SearchDocument[],
  query: string,
  options?: { locale?: Locale; limit?: number },
): SearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const scoped = options?.locale
    ? documents.filter((doc) => doc.locale === options.locale)
    : documents;

  const index = createSearchIndex(scoped);
  const results = index.search(trimmed, { combineWith: "AND" });
  const limit = options?.limit ?? 12;

  return results.slice(0, limit).map((result) => {
    const doc = scoped.find((item) => item.id === result.id);
    if (!doc) {
      throw new Error(`Missing search document for id ${result.id}`);
    }
    return {
      id: doc.id,
      locale: doc.locale,
      slug: doc.slug,
      href: doc.href,
      title: doc.title,
      description: doc.description,
      breadcrumb: doc.breadcrumb,
      score: result.score,
    };
  });
}

export function stripMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~|-]/g, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
