import { defineConfig } from "@ticidocs/config";

export default defineConfig({
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
