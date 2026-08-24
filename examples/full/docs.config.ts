import { defineConfig } from "@ticidocs/config";

export default defineConfig({
  name: "Full Example",
  description: "Guides + OpenAPI Ticidocs example",
  siteUrl: "https://example.com",
  locales: ["en", "tr"],
  defaultLocale: "en",
  navigation: [
    {
      group: "Getting Started",
      pages: ["index", "getting-started", "authentication", "advanced"],
    },
    {
      group: "API Reference",
      openapi: "./openapi/openapi.yaml",
      basePath: "api",
    },
  ],
  theme: {
    primaryColor: "#0f766e",
  },
  github: {
    url: "https://github.com/burakenal/ticidocs",
  },
  api: {
    allowedOrigins: ["https://api.example.com"],
  },
});
