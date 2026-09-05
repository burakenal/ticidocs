"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
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

const SIDEBAR_WIDTH_STORAGE_KEY = "ticidocs:sidebar-width";
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 480;

function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

function parseCssLengthToPx(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("px")) {
    const n = Number.parseFloat(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  if (trimmed.endsWith("rem")) {
    const n = Number.parseFloat(trimmed);
    if (!Number.isFinite(n)) return null;
    const root = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    return n * (Number.isFinite(root) ? root : 16);
  }
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

function readDefaultSidebarWidthPx(): number {
  const fromCss = parseCssLengthToPx(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--docs-sidebar-width",
    ),
  );
  return fromCss ?? 264;
}

function readStoredSidebarWidth(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return clampSidebarWidth(parsed);
  } catch {
    return null;
  }
}

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
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeActiveRef = useRef(false);
  const isHome = variant === "docs" && (!slug || slug === "index");

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  useEffect(() => {
    setSidebarWidth(readStoredSidebarWidth());
  }, []);

  useEffect(() => {
    if (sidebarWidth == null) return;
    try {
      window.localStorage.setItem(
        SIDEBAR_WIDTH_STORAGE_KEY,
        String(sidebarWidth),
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [sidebarWidth]);

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      resizeActiveRef.current = true;
      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [],
  );

  const onResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!resizeActiveRef.current) return;
      const next = clampSidebarWidth(event.clientX);
      setSidebarWidth(next);
    },
    [],
  );

  const endResize = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizeActiveRef.current) return;
    resizeActiveRef.current = false;
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const onResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 32 : 16;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setSidebarWidth((current) => {
          const base = current ?? readDefaultSidebarWidthPx();
          const delta = event.key === "ArrowLeft" ? -step : step;
          return clampSidebarWidth(base + delta);
        });
      } else if (event.key === "Home") {
        event.preventDefault();
        setSidebarWidth(SIDEBAR_MIN_WIDTH);
      } else if (event.key === "End") {
        event.preventDefault();
        setSidebarWidth(SIDEBAR_MAX_WIDTH);
      }
    },
    [],
  );

  const resetSidebarWidth = useCallback(() => {
    setSidebarWidth(null);
    try {
      window.localStorage.removeItem(SIDEBAR_WIDTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

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

  const bodyStyle =
    showDesktopSidebar && sidebarWidth != null
      ? ({ "--docs-sidebar-width": `${sidebarWidth}px` } as CSSProperties)
      : undefined;

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
        <div
          className={`${bodyClass}${isResizing ? ` ${styles.bodyResizing}` : ""}`}
          style={bodyStyle}
        >
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
              {showDesktopSidebar ? (
                <button
                  type="button"
                  className={`${styles.resizeHandle}${isResizing ? ` ${styles.resizeHandleActive}` : ""}`}
                  aria-label="Resize sidebar"
                  aria-orientation="vertical"
                  aria-valuemin={SIDEBAR_MIN_WIDTH}
                  aria-valuemax={SIDEBAR_MAX_WIDTH}
                  aria-valuenow={sidebarWidth ?? undefined}
                  onPointerDown={onResizePointerDown}
                  onPointerMove={onResizePointerMove}
                  onPointerUp={endResize}
                  onPointerCancel={endResize}
                  onKeyDown={onResizeKeyDown}
                  onDoubleClick={resetSidebarWidth}
                />
              ) : null}
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
            home={isHome}
          />
        ) : null}
      </div>
    </div>
  );
}
