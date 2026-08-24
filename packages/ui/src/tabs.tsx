"use client";

import {
  Children,
  isValidElement,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./tabs.module.css";

export function Tab({
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function Tabs({ children }: { children: ReactNode }) {
  const id = useId();
  const tabs = useMemo(() => {
    return Children.toArray(children).flatMap((child) => {
      if (!isValidElement(child)) {
        return [];
      }
      const element = child as ReactElement<{ title?: string; children?: ReactNode }>;
      const title = element.props.title;
      if (!title) {
        return [];
      }
      return [{ title, content: element.props.children }];
    });
  }, [children]);

  const [active, setActive] = useState(0);
  if (tabs.length === 0) {
    return null;
  }

  const current = Math.min(active, tabs.length - 1);

  return (
    <div className={styles.tabs}>
      <div className={styles.list} role="tablist" aria-label="Code examples">
        {tabs.map((tab, index) => {
          const selected = index === current;
          return (
            <button
              key={tab.title}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${index}`}
              className={`${styles.tab} ${selected ? styles.active : ""}`}
              onClick={() => setActive(index)}
            >
              {tab.title}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.title}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          hidden={index !== current}
          className={styles.panel}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
