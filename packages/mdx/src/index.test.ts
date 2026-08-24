import { describe, expect, it } from "vitest";
import {
  extractHeadings,
  parseFrontmatter,
  slugFromFilePath,
} from "./index.js";

describe("parseFrontmatter", () => {
  it("reads SEO fields", () => {
    const fm = parseFrontmatter({
      title: "Auth",
      description: "How to authenticate",
      noindex: true,
      order: 2,
    });
    expect(fm.title).toBe("Auth");
    expect(fm.noindex).toBe(true);
    expect(fm.order).toBe(2);
  });
});

describe("extractHeadings", () => {
  it("ignores headings inside fences", () => {
    const md = `# Title\n\n\`\`\`\n# Not a heading\n\`\`\`\n\n## Section\n`;
    const headings = extractHeadings(md);
    expect(headings.map((h) => h.text)).toEqual(["Title", "Section"]);
    expect(headings[1]?.id).toBe("section");
  });
});

describe("slugFromFilePath", () => {
  it("maps index files to empty slug", () => {
    expect(slugFromFilePath("index.mdx")).toBe("");
    expect(slugFromFilePath("api/index.mdx")).toBe("api");
    expect(slugFromFilePath("getting-started.mdx")).toBe("getting-started");
  });
});
