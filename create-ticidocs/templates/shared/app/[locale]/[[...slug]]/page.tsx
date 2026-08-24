import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { buildArticleJsonLd, localePath } from "@ticidocs/core";
import { DocsShell } from "@ticidocs/ui/docs-shell";
import { EndpointView } from "@ticidocs/ui/endpoint-view";
import { MdxContent } from "../../../components/mdx-content";
import {
  getDocsConfig,
  getSearchDocuments,
  getSeoForApi,
  getSeoForPage,
  getSidebar,
  getStaticLocaleSlugParams,
  hrefFor,
  parseDocsRoute,
  resolveApiOperation,
  resolveDocPage,
} from "../../../lib/docs";

interface PageProps {
  params: Promise<{ locale: string; slug?: string[] }>;
}

export function generateStaticParams() {
  return getStaticLocaleSlugParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug: slugParts } = await params;
  const config = getDocsConfig();
  if (!config.locales.includes(locale)) {
    return {};
  }

  const route = parseDocsRoute(locale, slugParts);
  if (route.missingVersion && route.defaultVersion) {
    return {};
  }

  const { version, slug } = route;
  const api = resolveApiOperation(slug);
  if (api) {
    const seo = getSeoForApi(locale, api.operation, version);
    const languages: Record<string, string> = {};
    for (const alt of seo.alternates) {
      languages[alt.locale] = alt.url;
    }
    languages["x-default"] = seo.xDefault;
    return {
      title: seo.title,
      description: seo.description,
      alternates: { canonical: seo.canonical, languages },
      openGraph: {
        title: seo.title,
        description: seo.description,
        url: seo.canonical,
        locale: seo.ogLocale,
        type: "article",
        siteName: config.name,
      },
      twitter: {
        card: "summary",
        title: seo.title,
        description: seo.description,
      },
    };
  }

  const resolved = resolveDocPage(locale, slug, version);
  if (!resolved) {
    return { title: "Not found" };
  }

  const seo = getSeoForPage(locale, slug, resolved.page, version);
  const languages: Record<string, string> = {};
  for (const alt of seo.alternates) {
    languages[alt.locale] = alt.url;
  }
  languages["x-default"] = seo.xDefault;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonical,
      languages,
    },
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      locale: seo.ogLocale,
      type: "article",
      siteName: config.name,
    },
    twitter: {
      card: "summary",
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function DocsPage({ params }: PageProps) {
  const { locale, slug: slugParts } = await params;
  const config = getDocsConfig();
  if (!config.locales.includes(locale)) {
    notFound();
  }

  const route = parseDocsRoute(locale, slugParts);
  if (route.missingVersion && route.defaultVersion) {
    redirect(localePath(locale, route.slug, route.defaultVersion));
  }

  const { version, slug } = route;
  const currentPath = hrefFor(locale, slug, version);
  const sidebar = getSidebar(locale, version);
  const searchDocuments = getSearchDocuments(locale, version);

  const api = resolveApiOperation(slug);
  if (api) {
    const seo = getSeoForApi(locale, api.operation, version);
    const jsonLd = buildArticleJsonLd({
      seo,
      siteName: config.name,
      siteUrl: config.siteUrl,
    });
    return (
      <DocsShell
        name={config.name}
        locale={locale}
        locales={config.locales}
        slug={slug}
        currentPath={currentPath}
        sidebar={sidebar}
        headings={[]}
        variant="api"
        logo={config.logo}
        githubUrl={config.github?.url}
        searchDocuments={searchDocuments}
        versions={config.versions}
        version={version}
        defaultLocale={config.defaultLocale}
        footer={config.footer}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <EndpointView
          operation={api.operation}
          document={api.document}
          allowedOrigins={config.api?.allowedOrigins ?? []}
        />
      </DocsShell>
    );
  }

  const resolved = resolveDocPage(locale, slug, version);
  if (!resolved) {
    notFound();
  }

  const { page, isFallback } = resolved;
  const seo = getSeoForPage(locale, slug, page, version);
  const jsonLd = buildArticleJsonLd({
    seo,
    siteName: config.name,
    siteUrl: config.siteUrl,
  });

  return (
    <DocsShell
      name={config.name}
      locale={locale}
      locales={config.locales}
      slug={slug}
      currentPath={currentPath}
      sidebar={sidebar}
      headings={page.headings}
      isFallback={isFallback}
      logo={config.logo}
      githubUrl={config.github?.url}
      searchDocuments={searchDocuments}
      versions={config.versions}
      version={version}
      defaultLocale={config.defaultLocale}
      footer={config.footer}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MdxContent source={page.body} />
    </DocsShell>
  );
}
