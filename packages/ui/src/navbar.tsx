"use client";

import { useCallback, useState } from "react";
import type { DocsLogo } from "@ticidocs/core";
import type { SearchDocument } from "@ticidocs/search";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { SearchDialog, useSearchHotkey } from "./search-dialog";
import styles from "./navbar.module.css";

export interface NavbarProps {
  name: string;
  locale: string;
  locales: string[];
  slug: string;
  logo?: DocsLogo;
  githubUrl?: string;
  menuOpen: boolean;
  onMenuClick: () => void;
  searchDocuments?: SearchDocument[];
}

export function Navbar({
  name,
  locale,
  locales,
  slug,
  logo,
  githubUrl,
  menuOpen,
  onMenuClick,
  searchDocuments = [],
}: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  useSearchHotkey(openSearch);

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="ticidocs-sidebar"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={onMenuClick}
        >
          <MenuIcon open={menuOpen} />
        </button>
        <a className={styles.brand} href={`/${locale}`}>
          {logo ? (
            <>
              <img
                className={`${styles.logo} ${styles.logoLight}`}
                src={logo.light}
                alt={name}
                height={28}
              />
              <img
                className={`${styles.logo} ${styles.logoDark}`}
                src={logo.dark}
                alt=""
                height={28}
                aria-hidden="true"
              />
            </>
          ) : (
            <span className={styles.brandText}>{name}</span>
          )}
        </a>
      </div>
      <div className={styles.center}>
        <button
          type="button"
          className={styles.searchButton}
          onClick={openSearch}
          aria-label="Search documentation"
        >
          <SearchIcon />
          <span className={styles.searchLabel}>Search...</span>
          <kbd className={styles.kbd}>Ctrl K</kbd>
        </button>
      </div>
      <div className={styles.right}>
        <LocaleSwitcher locale={locale} locales={locales} slug={slug} />
        <ThemeSwitcher />
        {githubUrl ? (
          <a
            className={styles.github}
            href={githubUrl}
            rel="noreferrer"
            target="_blank"
            aria-label="GitHub repository"
          >
            <GitHubIcon />
            <span>GitHub</span>
          </a>
        ) : null}
      </div>
      <SearchDialog
        documents={searchDocuments}
        locale={locale}
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 7.5c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.33 10.33 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}
