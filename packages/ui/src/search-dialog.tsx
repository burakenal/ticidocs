"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchDocuments, type SearchDocument, type SearchHit } from "@ticidocs/search";
import styles from "./search-dialog.module.css";

export interface SearchDialogProps {
  documents: SearchDocument[];
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({
  documents,
  locale,
  open,
  onOpenChange,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(
    () => searchDocuments(documents, query, { locale, limit: 10 }),
    [documents, locale, query],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (event.key === "Tab") {
        const root = dialogRef.current;
        if (!root) {
          return;
        }
        const focusable = getFocusable(root);
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((value) => Math.min(value + 1, Math.max(hits.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((value) => Math.max(value - 1, 0));
      }
      if (event.key === "Enter") {
        const hit = hits[activeIndex];
        if (hit) {
          window.location.assign(hit.href);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, hits, activeIndex, onOpenChange]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={() => onOpenChange(false)}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          placeholder="Search documentation..."
          aria-label="Search documentation"
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className={styles.results} role="listbox">
          {hits.length === 0 ? (
            <li className={styles.empty}>
              {query.trim() ? "No results" : "Type to search"}
            </li>
          ) : (
            hits.map((hit, index) => (
              <ResultRow
                key={hit.id}
                hit={hit}
                active={index === activeIndex}
                onHover={() => setActiveIndex(index)}
              />
            ))
          )}
        </ul>
        <div className={styles.hint}>↑↓ navigate · Enter open · Esc close</div>
      </div>
    </div>,
    document.body,
  );
}

function ResultRow({
  hit,
  active,
  onHover,
}: {
  hit: SearchHit;
  active: boolean;
  onHover: () => void;
}) {
  return (
    <li role="option" aria-selected={active}>
      <a
        className={`${styles.result} ${active ? styles.active : ""}`}
        href={hit.href}
        onMouseEnter={onHover}
      >
        <div className={styles.resultTitle}>{hit.title}</div>
        <div className={styles.resultMeta}>{hit.breadcrumb}</div>
        {hit.description ? (
          <div className={styles.resultDesc}>{hit.description}</div>
        ) : null}
      </a>
    </li>
  );
}

export function useSearchHotkey(onOpen: () => void): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const isHotkey =
        (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (!isHotkey) {
        return;
      }
      event.preventDefault();
      onOpen();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
  );
  return [...nodes].filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );
}
