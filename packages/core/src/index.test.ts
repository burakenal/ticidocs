import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildPageSeo,
  buildSidebar,
  localePath,
  normalizePageEntry,
  resolvePageWithFallback,
  toOgLocale,
  type DocsConfig,
  type DocPage,
} from "./index.js";

const baseConfig: DocsConfig = {
  name: "Demo",
  description: "Demo docs",
  siteUrl: "https://docs.example.com",
  locales: ["en", "tr"],
  defaultLocale: "en",
  navigation: [
    {
      group: "Getting Started",
      pages: ["index", "getting-started"],
    },
  ],
};

function page(locale: string, slug: string, title: string): DocPage {
  return {
    locale,
    slug,
    filePath: `${locale}/${slug || "index"}.mdx`,
    frontmatter: { title },
    headings: [],
    body: "",
  };
}

describe("localePath", () => {
  it("builds locale root and nested paths", () => {
    expect(localePath("en")).toBe("/en");
    expect(localePath("en", "getting-started")).toBe("/en/getting-started");
  });
});

describe("normalizePageEntry", () => {
  it("maps index to empty slug", () => {
    expect(normalizePageEntry("index")).toEqual({ path: "" });
  });
});

describe("buildSidebar", () => {
  it("resolves titles from frontmatter", () => {
    const map = new Map<string, DocPage>([
      ["", page("en", "", "Overview")],
      ["getting-started", page("en", "getting-started", "Getting Started")],
    ]);
    const sidebar = buildSidebar(baseConfig, "en", map);
    expect(sidebar[0]).toMatchObject({
      type: "group",
      title: "Getting Started",
    });
    if (sidebar[0]?.type === "group") {
      expect(sidebar[0].children[0]?.href).toBe("/en");
      expect(sidebar[0].children[1]?.href).toBe("/en/getting-started");
    }
  });
});

describe("resolvePageWithFallback", () => {
  it("falls back to default locale", () => {
    const pages = new Map([["en::auth", page("en", "auth", "Auth")]]);
    const result = resolvePageWithFallback({
      locale: "tr",
      slug: "auth",
      defaultLocale: "en",
      getPage: (locale, slug) => pages.get(`${locale}::${slug}`),
    });
    expect(result?.isFallback).toBe(true);
    expect(result?.page.frontmatter.title).toBe("Auth");
  });
});

describe("buildPageSeo", () => {
  it("includes hreflang alternates and x-default", () => {
    const seo = buildPageSeo({
      config: baseConfig,
      locale: "tr",
      slug: "getting-started",
      frontmatter: { title: "Başlangıç", description: "Kurulum" },
      availableLocales: ["en", "tr"],
    });
    expect(seo.canonical).toBe("https://docs.example.com/tr/getting-started");
    expect(seo.xDefault).toBe("https://docs.example.com/en/getting-started");
    expect(seo.alternates).toHaveLength(2);
    expect(toOgLocale("tr")).toBe("tr_TR");
    expect(absoluteUrl("https://docs.example.com/", "/en")).toBe(
      "https://docs.example.com/en",
    );
  });
});
