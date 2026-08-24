import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";
import {
  pageMapKey,
  type DocPage,
  type HeadingNode,
  type Locale,
  type PageFrontmatter,
} from "@ticidocs/core";

const FRONTMATTER_KEYS = [
  "title",
  "description",
  "sidebarTitle",
  "slug",
  "draft",
  "order",
  "icon",
  "noindex",
] as const;

export function parseFrontmatter(data: Record<string, unknown>): PageFrontmatter {
  const result: PageFrontmatter = {};
  for (const key of FRONTMATTER_KEYS) {
    if (!(key in data)) {
      continue;
    }
    const value = data[key];
    if (key === "draft" || key === "noindex") {
      if (typeof value === "boolean") {
        result[key] = value;
      }
      continue;
    }
    if (key === "order") {
      if (typeof value === "number") {
        result.order = value;
      }
      continue;
    }
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

export function extractHeadings(markdown: string): HeadingNode[] {
  const slugger = new GithubSlugger();
  const headings: HeadingNode[] = [];
  const lines = markdown.split(/\r?\n/);

  let inFence = false;
  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      continue;
    }
    const depth = match[1]!.length as 1 | 2 | 3;
    const text = match[2]!.replace(/#+\s*$/, "").trim();
    if (!text) {
      continue;
    }
    headings.push({
      id: slugger.slug(text),
      text,
      depth,
    });
  }
  return headings;
}

export function slugFromFilePath(relativePath: string): string {
  const withoutExt = relativePath.replace(/\.mdx?$/i, "");
  const normalized = withoutExt.replace(/\\/g, "/");
  if (normalized === "index" || normalized.endsWith("/index")) {
    return normalized.replace(/\/?index$/, "");
  }
  return normalized;
}

export function parseMdxFile(input: {
  locale: Locale;
  absolutePath: string;
  relativePath: string;
  version?: string;
}): DocPage {
  const raw = fs.readFileSync(input.absolutePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parseFrontmatter(data as Record<string, unknown>);
  const slug = frontmatter.slug ?? slugFromFilePath(input.relativePath);

  return {
    locale: input.locale,
    slug,
    filePath: input.absolutePath,
    frontmatter,
    headings: extractHeadings(content),
    body: content,
    version: input.version,
  };
}

export function loadLocalePages(
  contentRoot: string,
  locale: Locale,
  version?: string,
): DocPage[] {
  const localeDir = version
    ? path.join(contentRoot, version, locale)
    : path.join(contentRoot, locale);
  if (!fs.existsSync(localeDir)) {
    return [];
  }

  const pages: DocPage[] = [];

  function walk(dir: string, relativeDir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) {
        continue;
      }
      const absolutePath = path.join(dir, entry.name);
      const relativePath = relativeDir
        ? `${relativeDir}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        walk(absolutePath, relativePath);
        continue;
      }
      if (!/\.mdx?$/i.test(entry.name)) {
        continue;
      }

      const page = parseMdxFile({
        locale,
        absolutePath,
        relativePath,
        version,
      });
      if (page.frontmatter.draft) {
        continue;
      }
      pages.push(page);
    }
  }

  walk(localeDir, "");
  return pages.sort((a, b) => {
    const orderA = a.frontmatter.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.frontmatter.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.slug.localeCompare(b.slug);
  });
}

export function loadAllPages(
  contentRoot: string,
  locales: readonly Locale[],
  versions?: readonly string[],
  options?: { defaultVersion?: string },
): Map<string, DocPage> {
  const map = new Map<string, DocPage>();

  if (!versions?.length) {
    for (const locale of locales) {
      for (const page of loadLocalePages(contentRoot, locale)) {
        map.set(pageMapKey(locale, page.slug), page);
      }
    }
    return map;
  }

  const defaultVersion = options?.defaultVersion ?? versions[0];

  for (const version of versions) {
    for (const locale of locales) {
      let pages = loadLocalePages(contentRoot, locale, version);
      if (
        pages.length === 0 &&
        defaultVersion &&
        version === defaultVersion
      ) {
        // Soft migration: default version may still live at content/{locale}
        pages = loadLocalePages(contentRoot, locale).map((page) => ({
          ...page,
          version,
        }));
      }
      for (const page of pages) {
        map.set(pageMapKey(locale, page.slug, version), page);
      }
    }
  }
  return map;
}

export function getPageFromMap(
  map: Map<string, DocPage>,
  locale: Locale,
  slug: string,
  version?: string,
): DocPage | undefined {
  return map.get(pageMapKey(locale, slug, version));
}
