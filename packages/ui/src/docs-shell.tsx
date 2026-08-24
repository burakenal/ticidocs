"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildSectionTabs,
  localePath,
  resolveActiveSection,
  type DocsFooterConfig,
  type DocsLogo,
  type HeadingNode,
  type SidebarItem,
} from "@ticidocs/core";
import type { SearchDocument } from "@ticidocs/search";
import { Breadcrumbs, breadcrumbsFromSidebar } from "./breadcrumbs";
import { Footer } from "./footer";
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
  defaultLocale?: string;
  footer?: DocsFooterConfig;
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
  defaultLocale,
  footer,
  children,
}: DocsShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = variant === "docs" && (!slug || slug === "index");

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

  const hasTabs = sectionTabs.length > 1 && !isHome;
  const showToc = variant === "docs" && !isHome;
  const showDesktopSidebar = !isHome;
  const showMobileNav = sidebar.length > 0;
  const mobileNavItems = isHome ? sidebar : scopedSidebar;

  const shellClass = [
    styles.shell,
    hasTabs ? styles.shellWithTabs : "",
    isHome ? styles.shellHome : "",
  ]
    .filter(Boolean)
    .join(" ");

  const bodyClass = [
    styles.body,
    isHome ? styles.bodyHome : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mainColumnClass = [
    styles.mainColumn,
    variant === "api" ? styles.mainColumnApi : "",
    isHome ? styles.mainColumnHome : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mainClass = [
    styles.main,
    variant === "api" ? styles.mainApi : "",
    isHome ? styles.mainHome : "",
  ]
    .filter(Boolean)
    .join(" ");

  const articleClass = [
    styles.article,
    variant === "api" ? styles.articleApi : "",
    isHome ? styles.articleHome : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
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
          showMenu={showMobileNav}
          searchDocuments={searchDocuments}
          versions={versions}
          version={version}
        />
        {hasTabs ? <SectionTabs tabs={sectionTabs} /> : null}
        <div className={bodyClass}>
          {showDesktopSidebar || showMobileNav ? (
            <aside
              className={`${styles.sidebar} ${isHome ? styles.sidebarHomeMobile : ""} ${mobileOpen ? styles.sidebarOpen : ""}`}
              aria-label="Documentation navigation"
            >
              <Sidebar
                items={mobileNavItems}
                currentPath={currentPath}
                sectionTitle={hasTabs ? activeSection?.title : undefined}
              />
            </aside>
          ) : null}
          {showMobileNav && mobileOpen ? (
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
          ) : null}
          <div className={mainColumnClass}>
            <main className={mainClass}>
              {isFallback ? <FallbackBanner locale={locale} /> : null}
              <article className={articleClass}>
                {variant === "docs" && !isHome ? (
                  <Breadcrumbs items={crumbs} />
                ) : null}
                {children}
              </article>
            </main>
            {showToc ? (
              <aside className={styles.toc} aria-label="On this page">
                <TableOfContents headings={headings} />
              </aside>
            ) : null}
          </div>
        </div>
        {footer ? (
          <Footer
            name={name}
            locale={locale}
            defaultLocale={defaultLocale}
            version={version}
            logo={logo}
            footer={footer}
          />
        ) : null}
      </div>
    </div>
  );
}
