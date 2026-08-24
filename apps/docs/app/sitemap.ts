import type { MetadataRoute } from "next";
import {
  absoluteUrl,
  listSlugsFromNavigation,
  localePath,
} from "@ticidocs/core";
import {
  getAllApiOperations,
  getAllPages,
  getDocsConfig,
  getPage,
} from "../lib/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getDocsConfig();
  const entries: MetadataRoute.Sitemap = [];
  const versions = config.versions?.length
    ? config.versions
    : [undefined as string | undefined];

  const slugs = new Set(listSlugsFromNavigation(config));
  for (const page of getAllPages().values()) {
    slugs.add(page.slug);
  }

  for (const version of versions) {
    for (const slug of slugs) {
      for (const locale of config.locales) {
        const hasDirect = Boolean(getPage(locale, slug, version));
        const hasFallback =
          locale !== config.defaultLocale &&
          Boolean(getPage(config.defaultLocale, slug, version));
        if (!hasDirect && !hasFallback) {
          continue;
        }

        const page =
          getPage(locale, slug, version) ??
          getPage(config.defaultLocale, slug, version);
        if (page?.frontmatter.noindex) {
          continue;
        }

        const languages: Record<string, string> = {};
        for (const loc of config.locales) {
          if (
            getPage(loc, slug, version) ||
            getPage(config.defaultLocale, slug, version)
          ) {
            languages[loc] = absoluteUrl(
              config.siteUrl,
              localePath(loc, slug, version),
            );
          }
        }
        languages["x-default"] = absoluteUrl(
          config.siteUrl,
          localePath(config.defaultLocale, slug, version),
        );

        entries.push({
          url: absoluteUrl(config.siteUrl, localePath(locale, slug, version)),
          alternates: { languages },
        });
      }
    }

    for (const operation of getAllApiOperations()) {
      const languages: Record<string, string> = {};
      for (const loc of config.locales) {
        languages[loc] = absoluteUrl(
          config.siteUrl,
          localePath(loc, operation.slug, version),
        );
      }
      languages["x-default"] = absoluteUrl(
        config.siteUrl,
        localePath(config.defaultLocale, operation.slug, version),
      );

      for (const locale of config.locales) {
        entries.push({
          url: absoluteUrl(
            config.siteUrl,
            localePath(locale, operation.slug, version),
          ),
          alternates: { languages },
        });
      }
    }
  }

  return entries;
}
