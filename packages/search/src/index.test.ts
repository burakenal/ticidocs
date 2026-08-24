import { describe, expect, it } from "vitest";
import {
  buildSearchDocuments,
  searchDocuments,
  stripMarkdown,
  type SearchDocument,
} from "./index.js";
import type { DocPage } from "@ticidocs/core";

function page(partial: Partial<DocPage> & Pick<DocPage, "locale" | "slug">): DocPage {
  return {
    filePath: `${partial.locale}/${partial.slug}.mdx`,
    frontmatter: { title: "Auth", description: "API keys" },
    headings: [],
    body: "# Authentication\n\nUse an **API key**.",
    ...partial,
  };
}

describe("stripMarkdown", () => {
  it("removes fences and emphasis", () => {
    expect(stripMarkdown("Hello **world**\n```js\n1\n```")).toContain("Hello");
    expect(stripMarkdown("Hello **world**\n```js\n1\n```")).not.toContain("```");
  });
});

describe("searchDocuments", () => {
  it("ranks title matches highly", () => {
    const docs: SearchDocument[] = buildSearchDocuments([
      page({ locale: "en", slug: "authentication" }),
      page({
        locale: "en",
        slug: "getting-started",
        frontmatter: { title: "Getting Started", description: "Install" },
        body: "Install Ticidocs",
      }),
    ]);
    const hits = searchDocuments(docs, "authentication", { locale: "en" });
    expect(hits[0]?.slug).toBe("authentication");
  });
});
