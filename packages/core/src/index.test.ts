import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildPageSeo,
  buildSectionTabs,
  buildSidebar,
  firstSidebarHref,
  groupOpenApiLinksByTag,
  localePath,
  normalizePageEntry,
  resolveActiveSection,
  resolvePageWithFallback,
  toOgLocale,
  type DocsConfig,
  type DocPage,
  type SidebarItem,
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
      const first = sidebar[0].children[0];
      const second = sidebar[0].children[1];
      expect(first?.type === "page" ? first.href : undefined).toBe("/en");
      expect(second?.type === "page" ? second.href : undefined).toBe(
        "/en/getting-started",
      );
    }
  });

  it("nests OpenAPI links under tag submenus", () => {
    const config: DocsConfig = {
      ...baseConfig,
      navigation: [
        {
          group: "Marketplace API",
          openapi: "./openapi.json",
          basePath: "hub/api/marketplace",
        },
      ],
    };
    const sidebar = buildSidebar(config, "en", new Map(), [
      {
        type: "page",
        title: "List cargo",
        slug: "hub/api/marketplace/list-cargo",
        href: "/en/hub/api/marketplace/list-cargo",
        method: "get",
        tags: ["Kargo İşlemleri"],
      },
      {
        type: "page",
        title: "List products",
        slug: "hub/api/marketplace/list-products",
        href: "/en/hub/api/marketplace/list-products",
        method: "get",
        tags: ["Ürün İşlemleri"],
      },
    ]);

    expect(sidebar[0]).toMatchObject({
      type: "group",
      title: "Marketplace API",
    });
    if (sidebar[0]?.type !== "group") return;
    expect(sidebar[0].children).toHaveLength(2);
    expect(sidebar[0].children[0]).toMatchObject({
      type: "group",
      title: "Kargo İşlemleri",
    });
    expect(sidebar[0].children[1]).toMatchObject({
      type: "group",
      title: "Ürün İşlemleri",
    });
  });
});

describe("groupOpenApiLinksByTag", () => {
  it("keeps first-seen tag order and leaves untagged flat", () => {
    const nodes = groupOpenApiLinksByTag([
      {
        type: "page",
        title: "A",
        slug: "a",
        href: "/a",
        tags: ["Orders"],
      },
      {
        type: "page",
        title: "B",
        slug: "b",
        href: "/b",
        tags: ["Products"],
      },
      {
        type: "page",
        title: "C",
        slug: "c",
        href: "/c",
      },
    ]);
    expect(nodes.map((n) => ("title" in n ? n.title : ""))).toEqual([
      "Orders",
      "Products",
      "C",
    ]);
  });
});

describe("section tabs helpers", () => {
  const sidebar: SidebarItem[] = [
    {
      type: "group",
      title: "Overview",
      children: [{ type: "page", title: "Home", slug: "", href: "/en" }],
    },
    {
      type: "group",
      title: "Developer API",
      children: [
        {
          type: "group",
          title: "Vector",
          children: [
            {
              type: "page",
              title: "List indices",
              slug: "api/list",
              href: "/en/api/list",
              method: "get",
            },
          ],
        },
      ],
    },
    {
      type: "external",
      title: "Blog",
      href: "https://example.com/blog",
    },
  ];

  it("resolves the section that contains the current path", () => {
    const active = resolveActiveSection(sidebar, "/en/api/list");
    expect(active?.title).toBe("Developer API");
    expect(firstSidebarHref(active!.children)).toBe("/en/api/list");
  });

  it("builds product tabs with the active section marked", () => {
    const tabs = buildSectionTabs(sidebar, "/en/api/list");
    expect(tabs).toEqual([
      { title: "Overview", href: "/en", active: false },
      { title: "Developer API", href: "/en/api/list", active: true },
      {
        title: "Blog",
        href: "https://example.com/blog",
        active: false,
        external: true,
      },
    ]);
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

describe("buildArticleJsonLd", () => {
  it("emits Article schema for a page", () => {
    const seo = buildPageSeo({
      config: baseConfig,
      locale: "en",
      slug: "getting-started",
      frontmatter: { title: "Getting started", description: "Setup" },
      availableLocales: ["en"],
    });
    const jsonLd = buildArticleJsonLd({
      seo,
      siteName: baseConfig.name,
      siteUrl: baseConfig.siteUrl,
    });
    expect(jsonLd["@type"]).toBe("Article");
    expect(jsonLd.headline).toBe("Getting started");
    expect(jsonLd.url).toBe("https://docs.example.com/en/getting-started");
    expect(jsonLd.isPartOf.name).toBe(baseConfig.name);
  });
});
