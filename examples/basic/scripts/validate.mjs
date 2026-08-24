import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function main() {
  const { defineConfig } = await import("@ticidocs/config");
  const { loadAllPages } = await import("@ticidocs/mdx");
  const { listSlugsFromNavigation } = await import("@ticidocs/core");

  const config = defineConfig({
    name: "Basic Example",
    description: "Minimal Ticidocs example",
    siteUrl: "https://example.com",
    locales: ["en", "tr"],
    defaultLocale: "en",
    navigation: [
      {
        group: "Guides",
        pages: ["index", "getting-started"],
      },
    ],
  });

  const pages = loadAllPages(path.join(root, "content"), config.locales);
  const slugs = listSlugsFromNavigation(config);
  for (const slug of slugs) {
    const en = pages.get(`en::${slug}`);
    if (!en) {
      throw new Error(`Missing English page for slug "${slug}"`);
    }
  }

  console.log(
    `examples/basic OK — ${pages.size} pages, locales: ${config.locales.join(",")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
