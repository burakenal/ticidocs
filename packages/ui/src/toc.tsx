"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HeadingNode } from "@ticidocs/core";
import styles from "./toc.module.css";

export interface TableOfContentsProps {
  headings: HeadingNode[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const items = useMemo(
    () => headings.filter((heading) => heading.depth >= 2),
    [headings],
  );
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top) {
          setActiveId(top);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    for (const element of elements) {
      observerRef.current.observe(element);
    }

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.toc}>
      <div className={styles.title}>On this page</div>
      <ul className={styles.list}>
        {items.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li
              key={heading.id}
              className={heading.depth === 3 ? styles.depth3 : styles.depth2}
            >
              <a
                href={`#${heading.id}`}
                className={active ? styles.active : undefined}
                aria-current={active ? "location" : undefined}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
