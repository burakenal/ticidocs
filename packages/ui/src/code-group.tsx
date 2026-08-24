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
import styles from "./code-group.module.css";

export function CodeGroup({ children }: { children: ReactNode }) {
  const id = useId();
  const tabs = useMemo(() => {
    return Children.toArray(children).flatMap((child) => {
      if (!isValidElement(child)) {
        return [];
      }
      const element = child as ReactElement<{
        title?: string;
        "data-title"?: string;
        children?: ReactNode;
      }>;
      const title =
        element.props.title ??
        element.props["data-title"] ??
        inferTitleFromPre(element);
      if (!title) {
        return [];
      }
      return [{ title, content: element }];
    });
  }, [children]);

  const [active, setActive] = useState(0);
  if (tabs.length === 0) {
    return null;
  }

  const current = Math.min(active, tabs.length - 1);

  return (
    <div className={styles.group}>
      <div className={styles.list} role="tablist" aria-label="Code samples">
        {tabs.map((tab, index) => {
          const selected = index === current;
          return (
            <button
              key={`${tab.title}-${index}`}
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
          key={`${tab.title}-${index}`}
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

function inferTitleFromPre(
  element: ReactElement<{ className?: string; children?: ReactNode }>,
): string | undefined {
  const className = element.props.className ?? "";
  const match = /language-([\w-]+)/.exec(className);
  if (match?.[1]) {
    return match[1];
  }

  const kids = Children.toArray(element.props.children);
  for (const kid of kids) {
    if (!isValidElement<{ className?: string }>(kid)) {
      continue;
    }
    const childMatch = /language-([\w-]+)/.exec(kid.props.className ?? "");
    if (childMatch?.[1]) {
      return childMatch[1];
    }
  }
  return undefined;
}
