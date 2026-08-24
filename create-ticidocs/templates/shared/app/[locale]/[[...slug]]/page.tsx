import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  resolveApiOperation,
  resolveDocPage,
  slugFromParams,
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

  const slug = slugFromParams(slugParts);
  const api = resolveApiOperation(slug);
  if (api) {
    const seo = getSeoForApi(locale, api.operation);
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

  const resolved = resolveDocPage(locale, slug);
  if (!resolved) {
    return { title: "Not found" };
  }

  const seo = getSeoForPage(locale, slug, resolved.page);
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

  const slug = slugFromParams(slugParts);
  const currentPath = hrefFor(locale, slug);
  const sidebar = getSidebar(locale);
  const searchDocuments = getSearchDocuments(locale);

  const api = resolveApiOperation(slug);
  if (api) {
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
        githubUrl={config.github?.url}
        searchDocuments={searchDocuments}
      >
        <EndpointView
          operation={api.operation}
          document={api.document}
          allowedOrigins={config.api?.allowedOrigins ?? []}
        />
      </DocsShell>
    );
  }

  const resolved = resolveDocPage(locale, slug);
  if (!resolved) {
    notFound();
  }

  const { page, isFallback } = resolved;

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
      githubUrl={config.github?.url}
      searchDocuments={searchDocuments}
    >
      <MdxContent source={page.body} />
    </DocsShell>
  );
}
