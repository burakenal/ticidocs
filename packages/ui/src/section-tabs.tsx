import type { SectionTab } from "@ticidocs/core";
import styles from "./section-tabs.module.css";

export interface SectionTabsProps {
  tabs: SectionTab[];
}

export function SectionTabs({ tabs }: SectionTabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <nav className={styles.tabs} aria-label="Product sections">
      <div className={styles.inner}>
        {tabs.map((tab) => {
          const className = tab.active
            ? `${styles.tab} ${styles.active}`
            : styles.tab;
          if (tab.external) {
            return (
              <a
                key={`ext:${tab.href}`}
                className={className}
                href={tab.href}
                rel="noreferrer"
                target="_blank"
              >
                {tab.title}
              </a>
            );
          }
          return (
            <a
              key={tab.href}
              className={className}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
            >
              {tab.title}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
