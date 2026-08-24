import type { MetadataRoute } from "next";
import { getDocsConfig } from "../lib/docs";

export default function robots(): MetadataRoute.Robots {
  const config = getDocsConfig();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${config.siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
