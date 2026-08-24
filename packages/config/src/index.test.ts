import { describe, expect, it } from "vitest";
import { defineConfig } from "./index.js";

describe("defineConfig", () => {
  it("accepts a valid config", () => {
    const config = defineConfig({
      name: "Ticidocs",
      siteUrl: "https://docs.example.com",
      locales: ["en", "tr"],
      defaultLocale: "en",
      navigation: [{ group: "Start", pages: ["index"] }],
    });
    expect(config.defaultLocale).toBe("en");
  });

  it("rejects defaultLocale outside locales", () => {
    expect(() =>
      defineConfig({
        name: "Ticidocs",
        siteUrl: "https://docs.example.com",
        locales: ["en"],
        defaultLocale: "tr",
        navigation: [{ group: "Start", pages: ["index"] }],
      }),
    ).toThrow(/Invalid docs\.config\.ts/);
  });

  it("accepts versions and defaultVersion", () => {
    const config = defineConfig({
      name: "Ticidocs",
      siteUrl: "https://docs.example.com",
      locales: ["en"],
      defaultLocale: "en",
      versions: ["v1", "v2"],
      defaultVersion: "v1",
      navigation: [{ group: "Start", pages: ["index"] }],
    });
    expect(config.versions).toEqual(["v1", "v2"]);
    expect(config.defaultVersion).toBe("v1");
  });

  it("rejects defaultVersion outside versions", () => {
    expect(() =>
      defineConfig({
        name: "Ticidocs",
        siteUrl: "https://docs.example.com",
        locales: ["en"],
        defaultLocale: "en",
        versions: ["v1"],
        defaultVersion: "v9",
        navigation: [{ group: "Start", pages: ["index"] }],
      }),
    ).toThrow(/Invalid docs\.config\.ts/);
  });

  it("accepts nested OpenAPI groups inside pages", () => {
    const config = defineConfig({
      name: "Ticidocs",
      siteUrl: "https://docs.example.com",
      locales: ["en"],
      defaultLocale: "en",
      navigation: [
        {
          group: "Product",
          pages: [
            "index",
            {
              group: "API",
              openapi: "./openapi.yaml",
              basePath: "api",
            },
          ],
        },
      ],
    });
    const product = config.navigation[0];
    expect(product && "pages" in product).toBe(true);
    if (product && "pages" in product) {
      expect(product.pages[1]).toMatchObject({
        group: "API",
        openapi: "./openapi.yaml",
      });
    }
  });

  it("accepts theme fonts and layout", () => {
    const config = defineConfig({
      name: "Ticidocs",
      siteUrl: "https://docs.example.com",
      locales: ["en"],
      defaultLocale: "en",
      navigation: [{ group: "Start", pages: ["index"] }],
      theme: {
        primaryColor: "#0B6BCB",
        fonts: {
          sans: "Plus Jakarta Sans",
          mono: "JetBrains Mono",
        },
        layout: {
          sidebarWidth: "16rem",
          apiRailWidth: "26rem",
        },
      },
    });
    expect(config.theme?.fonts?.sans).toBe("Plus Jakarta Sans");
    expect(config.theme?.layout?.sidebarWidth).toBe("16rem");
  });
});
