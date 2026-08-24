"use client";

import { localePath } from "@ticidocs/core";
import styles from "./controls.module.css";

export interface VersionSwitcherProps {
  version: string;
  versions: string[];
  locale: string;
  slug: string;
}

export function VersionSwitcher({
  version,
  versions,
  locale,
  slug,
}: VersionSwitcherProps) {
  if (versions.length < 2) {
    return (
      <span className={styles.versionLabel} title="Documentation version">
        {version}
      </span>
    );
  }

  return (
    <label className={styles.locale}>
      <span className={styles.srOnly}>Version</span>
      <select
        className={styles.control}
        value={version}
        aria-label="Documentation version"
        onChange={(event) => {
          const next = event.target.value;
          window.location.assign(localePath(locale, slug, next));
        }}
      >
        {versions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
