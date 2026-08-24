import { defineConfig } from "@ticidocs/config";

export default defineConfig({
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
