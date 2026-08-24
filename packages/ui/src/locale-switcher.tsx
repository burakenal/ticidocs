"use client";

import { localePath, setLocalePreference } from "@ticidocs/core";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./controls.module.css";

export interface LocaleSwitcherProps {
  locale: string;
  locales: string[];
  slug: string;
  version?: string;
}

function languageName(code: string, displayLocale: string): string {
  try {
    const name = new Intl.DisplayNames([displayLocale], {
      type: "language",
    }).of(code);
    if (name) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch {
    // ignore unsupported locale codes
  }
  return code.toUpperCase();
}

export function LocaleSwitcher({
  locale,
  locales,
  slug,
  version,
}: LocaleSwitcherProps) {
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
        buttonRef.current?.focus();
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

  const currentLabel = languageName(locale, locale);

  return (
    <div className={styles.localeRoot} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.localeTrigger}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={`Language: ${currentLabel}`}
        title={currentLabel}
        onClick={toggleOpen}
      >
        <GlobeIcon />
        <span className={styles.localeCode}>{locale.toUpperCase()}</span>
        <ChevronIcon open={open} />
      </button>
      {open && menuPos ? (
        <ul
          id={listId}
          className={styles.localeMenu}
          role="listbox"
          aria-label="Language"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          {locales.map((item) => {
            const selected = item === locale;
            const name = languageName(item, locale);
            return (
              <li key={item} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    selected
                      ? `${styles.localeOption} ${styles.localeOptionActive}`
                      : styles.localeOption
                  }
                  onClick={() => {
                    setOpen(false);
                    if (item !== locale) {
                      setLocalePreference(item);
                      window.location.assign(localePath(item, slug, version));
                    }
                  }}
                >
                  <span className={styles.localeOptionCode}>
                    {item.toUpperCase()}
                  </span>
                  <span className={styles.localeOptionName}>{name}</span>
                  {selected ? <CheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      className={styles.localeIcon}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? `${styles.localeChevron} ${styles.localeChevronOpen}` : styles.localeChevron}
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

function CheckIcon() {
  return (
    <svg
      className={styles.localeCheck}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
