import { defineConfig } from "@ticidocs/config";

export default defineConfig({
  name: "Ticidocs",
  description: "Open-source documentation platform",
  siteUrl: "https://docs.ticidocs.dev",
  locales: ["en", "tr"],
  defaultLocale: "en",
  logo: {
    light: "/logo.png",
    dark: "/logo.png",
  },
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
    primaryColor: "#0055FF",
  },
  github: {
    url: "https://github.com/enal/ticidocs",
  },
  api: {
    allowedOrigins: ["https://api.example.com"],
  },
});
