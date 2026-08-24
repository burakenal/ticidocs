"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CodeSampleLanguage } from "@ticidocs/openapi/codegen";
import { apiCopy } from "./api-copy";
import styles from "./api-code-rail.module.css";

export const LANG_META: Record<CodeSampleLanguage, string> = {
  curl: "cURL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  csharp: "C#",
  python: "Python",
};

export function SampleCard({
  title,
  actions,
  children,
  bodyClassName,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>{title}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div
        className={
          bodyClassName ? `${styles.cardBody} ${bodyClassName}` : styles.cardBody
        }
      >
        {children}
      </div>
    </section>
  );
}

export function LanguageMenu({
  languages,
  value,
  onChange,
}: {
  languages: CodeSampleLanguage[];
  value: CodeSampleLanguage;
  onChange: (language: CodeSampleLanguage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    updatePosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className={styles.langSelect} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.langBtn}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        title={LANG_META[value]}
        aria-label={`Language: ${LANG_META[value]}`}
        onClick={toggleOpen}
      >
        <span className={styles.langLabel}>{LANG_META[value]}</span>
        <ChevronIcon />
      </button>
      {open && menuPos ? (
        <ul
          id={listId}
          className={styles.langMenu}
          role="listbox"
          aria-label="Language"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          {languages.map((language) => {
            const selected = language === value;
            return (
              <li key={language} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    selected
                      ? `${styles.langOption} ${styles.langOptionActive}`
                      : styles.langOption
                  }
                  onClick={() => {
                    onChange(language);
                    setOpen(false);
                  }}
                >
                  {LANG_META[language]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function CopyIconButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.iconBtn}
      onClick={onCopy}
      title={copied ? apiCopy.copied : apiCopy.copy}
      aria-label={copied ? apiCopy.copied : apiCopy.copy}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  );
}

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span className={className ? `${styles.status} ${className}` : styles.status}>
      {status}
    </span>
  );
}

function ChevronIcon() {
  return (
    <svg
      className={styles.chevron}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 4.5 6 7.5 9 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
