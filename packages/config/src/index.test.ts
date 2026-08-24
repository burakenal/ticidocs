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
});
