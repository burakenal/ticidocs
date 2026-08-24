import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function main() {
  const { defineConfig } = await import("@ticidocs/config");
  const { loadAllPages } = await import("@ticidocs/mdx");
  const { isNavOpenApiGroup, listSlugsFromNavigation } = await import(
    "@ticidocs/core"
  );
  const { loadOpenApiFile } = await import("@ticidocs/openapi");

  const config = defineConfig({
    name: "API Example",
    description: "Ticidocs example with OpenAPI",
    siteUrl: "https://example.com",
    locales: ["en", "tr"],
    defaultLocale: "en",
    navigation: [
      {
        group: "Guides",
        pages: ["index", "getting-started"],
      },
      {
        group: "API Reference",
        openapi: "./openapi/openapi.yaml",
        basePath: "api",
      },
    ],
    api: {
      allowedOrigins: ["https://api.example.com"],
    },
  });

  const pages = loadAllPages(path.join(root, "content"), config.locales);
  const slugs = listSlugsFromNavigation(config);
  for (const slug of slugs) {
    const en = pages.get(`en::${slug}`);
    if (!en) {
      throw new Error(`Missing English page for slug "${slug}"`);
    }
  }

  for (const item of config.navigation.filter(isNavOpenApiGroup)) {
    const doc = loadOpenApiFile(path.resolve(root, item.openapi), {
      basePath: item.basePath ?? "api",
    });
    if (doc.operations.length === 0) {
      throw new Error(`No operations in ${item.openapi}`);
    }
  }

  console.log(
    `examples/api OK — ${pages.size} pages, locales: ${config.locales.join(",")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
