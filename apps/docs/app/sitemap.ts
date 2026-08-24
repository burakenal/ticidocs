import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  listSlugsFromNavigation,
  localePath,
} from "@ticidocs/core";
import { getAllPages, getDocsConfig, getPage } from "../lib/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getDocsConfig();
  const slugs = new Set(listSlugsFromNavigation(config));
  for (const page of getAllPages().values()) {
    slugs.add(page.slug);
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const slug of slugs) {
    for (const locale of config.locales) {
      const hasDirect = Boolean(getPage(locale, slug));
      const hasFallback =
        locale !== config.defaultLocale &&
        Boolean(getPage(config.defaultLocale, slug));
      if (!hasDirect && !hasFallback) {
        continue;
      }

      const page = getPage(locale, slug) ?? getPage(config.defaultLocale, slug);
      if (page?.frontmatter.noindex) {
        continue;
      }

      const languages: Record<string, string> = {};
      for (const loc of config.locales) {
        if (getPage(loc, slug) || getPage(config.defaultLocale, slug)) {
          languages[loc] = absoluteUrl(
            config.siteUrl,
            localePath(loc, slug),
          );
        }
      }
      languages["x-default"] = absoluteUrl(
        config.siteUrl,
        localePath(config.defaultLocale, slug),
      );

      entries.push({
        url: absoluteUrl(config.siteUrl, localePath(locale, slug)),
        alternates: { languages },
      });
    }
  }

  return entries;
}
