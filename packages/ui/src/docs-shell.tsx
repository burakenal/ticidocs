"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildSectionTabs,
  localePath,
  resolveActiveSection,
  type DocsLogo,
  type HeadingNode,
  type SidebarItem,
} from "@ticidocs/core";
import type { SearchDocument } from "@ticidocs/search";
import { Breadcrumbs, breadcrumbsFromSidebar } from "./breadcrumbs";
import { Navbar } from "./navbar";
import { SectionTabs } from "./section-tabs";
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
  versions?: string[];
  version?: string;
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
  versions,
  version,
  children,
}: DocsShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  const sectionTabs = useMemo(
    () => buildSectionTabs(sidebar, currentPath),
    [sidebar, currentPath],
  );

  const activeSection = useMemo(
    () => resolveActiveSection(sidebar, currentPath),
    [sidebar, currentPath],
  );

  const scopedSidebar = useMemo((): SidebarItem[] => {
    if (!activeSection) {
      return sidebar;
    }
    return [
      {
        type: "group",
        title: activeSection.title,
        icon: activeSection.icon,
        children: activeSection.children,
      },
    ];
  }, [sidebar, activeSection]);

  const homeHref = localePath(locale, "", version);
  const crumbs = useMemo(
    () => breadcrumbsFromSidebar(sidebar, currentPath, homeHref),
    [sidebar, currentPath, homeHref],
  );

  const hasTabs = sectionTabs.length > 1;

  return (
    <div
      className={`${styles.shell} ${hasTabs ? styles.shellWithTabs : ""}`}
    >
      <div className={styles.frame}>
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
          versions={versions}
          version={version}
        />
        {hasTabs ? <SectionTabs tabs={sectionTabs} /> : null}
        <div className={styles.body}>
          <aside
            className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}
            aria-label="Documentation navigation"
          >
            <Sidebar
              items={scopedSidebar}
              currentPath={currentPath}
              sectionTitle={hasTabs ? activeSection?.title : undefined}
            />
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
                {variant === "docs" ? <Breadcrumbs items={crumbs} /> : null}
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
    </div>
  );
}
