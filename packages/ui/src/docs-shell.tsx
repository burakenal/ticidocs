"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DocsLogo, HeadingNode, SidebarItem } from "@ticidocs/core";
import type { SearchDocument } from "@ticidocs/search";
import { Breadcrumbs, breadcrumbsFromSidebar } from "./breadcrumbs";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { TableOfContents } from "./toc";
import { FallbackBanner } from "./fallback-banner";
import styles from "./docs-shell.module.css";

export interface DocsShellProps {
  name: string;
  locale: string;
  locales: string[];
  slug: string;
  currentPath: string;
  sidebar: SidebarItem[];
  headings: HeadingNode[];
  isFallback?: boolean;
  logo?: DocsLogo;
  githubUrl?: string;
  searchDocuments?: SearchDocument[];
  /** API reference pages use a wider layout without the TOC rail. */
  variant?: "docs" | "api";
  children: ReactNode;
}

export function DocsShell({
  name,
  locale,
  locales,
  slug,
  currentPath,
  sidebar,
  headings,
  isFallback,
  logo,
  githubUrl,
  searchDocuments,
  variant = "docs",
  children,
}: DocsShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  const crumbs = useMemo(
    () => breadcrumbsFromSidebar(sidebar, currentPath, `/${locale}`),
    [sidebar, currentPath, locale],
  );

  return (
    <div className={styles.shell}>
      <Navbar
        name={name}
        locale={locale}
        locales={locales}
        slug={slug}
        logo={logo}
        githubUrl={githubUrl}
        onMenuClick={() => setMobileOpen((open) => !open)}
        menuOpen={mobileOpen}
        searchDocuments={searchDocuments}
      />
      <div className={styles.body}>
        <aside
          className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
          aria-label="Documentation navigation"
        >
          <Sidebar items={sidebar} currentPath={currentPath} />
        </aside>
        {mobileOpen ? (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <div
          className={`${styles.mainColumn} ${variant === "api" ? styles.mainColumnApi : ""}`}
        >
          <main
            className={`${styles.main} ${variant === "api" ? styles.mainApi : ""}`}
          >
            {isFallback ? <FallbackBanner locale={locale} /> : null}
            <article
              className={`${styles.article} ${variant === "api" ? styles.articleApi : ""}`}
            >
              <Breadcrumbs items={crumbs} />
              {children}
            </article>
          </main>
          {variant === "docs" ? (
            <aside className={styles.toc} aria-label="On this page">
              <TableOfContents headings={headings} />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
