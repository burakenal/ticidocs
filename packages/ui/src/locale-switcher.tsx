"use client";

import { localePath } from "@ticidocs/core";
import styles from "./controls.module.css";

export interface LocaleSwitcherProps {
  locale: string;
  locales: string[];
  slug: string;
}

export function LocaleSwitcher({ locale, locales, slug }: LocaleSwitcherProps) {
  return (
    <label className={styles.locale}>
      <span className={styles.srOnly}>Language</span>
      <select
        className={styles.control}
        value={locale}
        aria-label="Language"
        onChange={(event) => {
          const next = event.target.value;
          window.location.assign(localePath(next, slug));
        }}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
